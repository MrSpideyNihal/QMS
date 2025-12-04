import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/register', '/public', '/api/auth/login', '/api/auth/register'];

    // Check if current path is a public route
    if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check if accessing protected routes
    const protectedRoutes = ['/dashboard', '/queue', '/tables', '/tokens', '/analytics', '/settings', '/logs', '/dev'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const user = await verifyToken(token);
        if (!user) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('auth-token');
            return response;
        }

        // Developer-only routes
        if (pathname.startsWith('/dev') && user.role !== 'developer') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Admin-only routes
        if ((pathname.startsWith('/settings') || pathname.startsWith('/analytics')) &&
            user.role !== 'admin' && user.role !== 'developer') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // API route protection
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
