import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Settings from '@/lib/models/Settings';
import { getAuthUser, isAdmin } from '@/lib/auth';

export async function GET() {
    try {
        await connectDB();

        let settings = await Settings.findOne();

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.create({
                gracePeriodMinutes: 15,
                autoRefresh: true,
                operatingHours: {
                    open: '09:00',
                    close: '22:00',
                },
                avgSeatTimeMinutes: 45,
            });
        }

        return NextResponse.json({ settings });
    } catch (error: any) {
        console.error('Get settings error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user || !isAdmin(user)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create(body);
        } else {
            const allowedFields = [
                'gracePeriodMinutes',
                'autoRefresh',
                'operatingHours',
                'avgSeatTimeMinutes',
            ];

            for (const field of allowedFields) {
                if (body[field] !== undefined) {
                    (settings as any)[field] = body[field];
                }
            }

            await settings.save();
        }

        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        console.error('Update settings error:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
