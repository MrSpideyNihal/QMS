import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Token from '@/lib/models/Token';
import OverrideLog from '@/lib/models/OverrideLog';
import { getAuthUser } from '@/lib/auth';
import { recalculateQueuePositions } from '@/lib/queueUtils';
import { emitQueueChanged, emitTokenUpdate } from '@/lib/socket';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const token = await Token.findById(params.id).populate('assignedTable');

        if (!token) {
            return NextResponse.json({ error: 'Token not found' }, { status: 404 });
        }

        return NextResponse.json({ token });
    } catch (error: any) {
        console.error('Get token error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch token' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const token = await Token.findById(params.id);

        if (!token) {
            return NextResponse.json({ error: 'Token not found' }, { status: 404 });
        }

        // Update allowed fields
        const allowedFields = [
            'customerName',
            'phoneNumber',
            'partySize',
            'status',
            'queuePosition',
            'shareConsent',
        ];

        let queueChanged = false;

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === 'queuePosition' && body[field] !== token.queuePosition) {
                    queueChanged = true;
                }
                (token as any)[field] = body[field];
            }
        }

        await token.save();

        // Recalculate queue if position changed
        if (queueChanged) {
            await recalculateQueuePositions();

            // Log the override
            await OverrideLog.create({
                action: 'manual_reorder',
                performedBy: user.email,
                tokenId: token._id,
                reason: body.reason || 'Manual queue reorder',
                timestamp: new Date(),
            });
        }

        // Emit socket events
        emitTokenUpdate(token._id.toString(), token);
        if (queueChanged) {
            emitQueueChanged();
        }

        return NextResponse.json({ success: true, token });
    } catch (error: any) {
        console.error('Update token error:', error);
        return NextResponse.json(
            { error: 'Failed to update token' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = await Token.findById(params.id);

        if (!token) {
            return NextResponse.json({ error: 'Token not found' }, { status: 404 });
        }

        // Mark as cancelled instead of deleting
        token.status = 'cancelled';
        await token.save();

        // Recalculate queue
        await recalculateQueuePositions();

        // Log the cancellation
        await OverrideLog.create({
            action: 'cancel_token',
            performedBy: user.email,
            tokenId: token._id,
            reason: 'Token cancelled',
            timestamp: new Date(),
        });

        // Emit socket events
        emitTokenUpdate(token._id.toString(), token);
        emitQueueChanged();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete token error:', error);
        return NextResponse.json(
            { error: 'Failed to delete token' },
            { status: 500 }
        );
    }
}
