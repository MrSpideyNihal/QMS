import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { getAuthUser, isDeveloper } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);

        if (!user || !isDeveloper(user)) {
            return NextResponse.json(
                { error: 'Unauthorized - Developer access required' },
                { status: 403 }
            );
        }

        await connectDB();

        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            users,
            total: users.length,
        });
    } catch (error: any) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
