import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { signToken, getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { email, password, role } = body;

        if (!email || !password || !role) {
            return NextResponse.json(
                { error: 'Email, password, and role are required' },
                { status: 400 }
            );
        }

        // Validate role
        if (!['developer', 'admin', 'staff'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        // Only developers can create other developers
        // Only admins/developers can create admins
        const currentUser = await getAuthUser();

        if (role === 'developer' && currentUser?.role !== 'developer') {
            return NextResponse.json(
                { error: 'Only developers can create developer accounts' },
                { status: 403 }
            );
        }

        if (role === 'admin' && currentUser?.role !== 'developer' && currentUser?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only admins or developers can create admin accounts' },
                { status: 403 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
        });

        // Generate JWT token
        const token = signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        // Set cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });

        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
