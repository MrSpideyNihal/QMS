import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { assignTableToToken } from '@/lib/queueUtils';
import { emitQueueChanged, emitTokenUpdate, emitTableUpdate } from '@/lib/socket';

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

        const body = await request.json();
        const { tableIds, assignmentType } = body;

        if (!tableIds || !Array.isArray(tableIds) || tableIds.length === 0) {
            return NextResponse.json(
                { error: 'Table IDs are required' },
                { status: 400 }
            );
        }

        await assignTableToToken(
            params.id,
            tableIds,
            assignmentType || 'single',
            user.email
        );

        // Emit socket events
        emitTokenUpdate(params.id, { status: 'seated' });
        for (const tableId of tableIds) {
            emitTableUpdate(tableId, { status: 'occupied' });
        }
        emitQueueChanged();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Assign table error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to assign table' },
            { status: 500 }
        );
    }
}
