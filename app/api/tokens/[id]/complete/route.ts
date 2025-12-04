import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { completeToken } from '@/lib/queueUtils';
import { emitQueueChanged, emitTokenUpdate, emitTableUpdate } from '@/lib/socket';
import Token from '@/lib/models/Token';

export async function POST(
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

        const tableId = token.assignedTable?.toString();

        await completeToken(params.id, user.email);

        // Emit socket events
        emitTokenUpdate(params.id, { status: 'completed' });
        if (tableId) {
            emitTableUpdate(tableId, { status: 'free' });
        }
        emitQueueChanged();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Complete token error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to complete token' },
            { status: 500 }
        );
    }
}
