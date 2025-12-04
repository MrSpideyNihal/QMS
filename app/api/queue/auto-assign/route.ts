import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { autoAssignTables } from '@/lib/queueUtils';

export async function POST() {
    try {
        await connectDB();

        const assignedCount = await autoAssignTables();

        return NextResponse.json({
            success: true,
            assignedCount,
            message: `Auto-assigned ${assignedCount} token(s)`,
        });
    } catch (error: any) {
        console.error('Auto-assign error:', error);
        return NextResponse.json(
            { error: 'Failed to auto-assign tables' },
            { status: 500 }
        );
    }
}
