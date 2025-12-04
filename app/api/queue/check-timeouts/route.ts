import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { checkReservationTimeouts } from '@/lib/queueUtils';

export async function POST() {
    try {
        await connectDB();

        const timeoutCount = await checkReservationTimeouts();

        return NextResponse.json({
            success: true,
            timeoutCount,
            message: `Processed ${timeoutCount} timeout(s)`,
        });
    } catch (error: any) {
        console.error('Check timeouts error:', error);
        return NextResponse.json(
            { error: 'Failed to check timeouts' },
            { status: 500 }
        );
    }
}
