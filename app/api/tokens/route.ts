import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Token from '@/lib/models/Token';
import Analytics from '@/lib/models/Analytics';
import { getAuthUser } from '@/lib/auth';
import {
    generateTokenNumber,
    getNextQueuePosition,
    calculateEstimatedWaitTime,
    updateAnalytics,
} from '@/lib/queueUtils';
import { emitQueueChanged } from '@/lib/socket';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const query: any = {};
        if (status) query.status = status;
        if (type) query.type = type;

        const tokens = await Token.find(query)
            .sort({ queuePosition: 1, createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('assignedTable');

        const total = await Token.countDocuments(query);

        return NextResponse.json({
            tokens,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Get tokens error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tokens' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            customerName,
            phoneNumber,
            partySize,
            type,
            reservationTime,
            shareConsent,
        } = body;

        // Validation
        if (!customerName || !phoneNumber || !partySize) {
            return NextResponse.json(
                { error: 'Customer name, phone number, and party size are required' },
                { status: 400 }
            );
        }

        if (partySize < 1) {
            return NextResponse.json(
                { error: 'Party size must be at least 1' },
                { status: 400 }
            );
        }

        if (type === 'reservation' && !reservationTime) {
            return NextResponse.json(
                { error: 'Reservation time is required for reservations' },
                { status: 400 }
            );
        }

        // Generate token number
        const tokenNumber = await generateTokenNumber();
        const queuePosition = await getNextQueuePosition();
        const estimatedWaitTime = await calculateEstimatedWaitTime(queuePosition);

        // Create token
        const token = await Token.create({
            tokenNumber,
            customerName,
            phoneNumber,
            partySize,
            type: type || 'walkin',
            reservationTime: reservationTime ? new Date(reservationTime) : undefined,
            arrivalTime: new Date(),
            queuePosition,
            estimatedWaitTime,
            shareConsent: shareConsent || false,
            status: 'waiting',
        });

        // Update analytics
        await updateAnalytics();

        // Emit socket event
        emitQueueChanged();

        return NextResponse.json({ success: true, token }, { status: 201 });
    } catch (error: any) {
        console.error('Create token error:', error);
        return NextResponse.json(
            { error: 'Failed to create token' },
            { status: 500 }
        );
    }
}
