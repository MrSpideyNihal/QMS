import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export interface JWTPayload {
    userId: string;
    email: string;
    role: 'developer' | 'admin' | 'staff';
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return null;
        }

        return verifyToken(token);
    } catch (error) {
        return null;
    }
}

export function hasRole(user: JWTPayload | null, allowedRoles: string[]): boolean {
    if (!user) return false;
    return allowedRoles.includes(user.role);
}

export function isDeveloper(user: JWTPayload | null): boolean {
    return user?.role === 'developer';
}

export function isAdmin(user: JWTPayload | null): boolean {
    return user?.role === 'admin' || user?.role === 'developer';
}

export function isStaff(user: JWTPayload | null): boolean {
    return user?.role === 'staff' || user?.role === 'admin' || user?.role === 'developer';
}
