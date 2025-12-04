import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Analytics from '@/lib/models/Analytics';
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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const query: any = {};

        if (startDate) {
            query.date = { $gte: new Date(startDate) };
        }

        if (endDate) {
            query.date = {
                ...query.date,
                $lte: new Date(endDate),
            };
        }

        const analytics = await Analytics.find(query).sort({ date: -1, hour: -1 });

        // Calculate summary statistics
        const totalTokens = analytics.reduce((sum, a) => sum + a.tokenCount, 0);
        const avgWaitTime =
            analytics.length > 0
                ? analytics.reduce((sum, a) => sum + (a.avgWaitTime || 0), 0) / analytics.length
                : 0;
        const peakHours = analytics.filter((a) => a.peakHour);
        const shareConsentTotal = analytics.reduce(
            (sum, a) => sum + (a.shareConsentCount || 0),
            0
        );

        return NextResponse.json({
            analytics,
            summary: {
                totalTokens,
                avgWaitTime: Math.round(avgWaitTime),
                peakHoursCount: peakHours.length,
                shareConsentTotal,
                shareConsentRate:
                    totalTokens > 0 ? ((shareConsentTotal / totalTokens) * 100).toFixed(1) : 0,
            },
        });
    } catch (error: any) {
        console.error('Get analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
