import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import OverrideLog from '@/lib/models/OverrideLog';
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user || !isAdmin(user)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const query: any = {};

        if (action) {
            query.action = action;
        }

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }

        const logs = await OverrideLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('tokenId')
            .populate('tableId');

        const total = await OverrideLog.countDocuments(query);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Get logs error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
