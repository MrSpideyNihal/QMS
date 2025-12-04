import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
    userId: string;
    email: string;
    role: 'developer' | 'admin' | 'staff';
    [key: string]: any;
}

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, encodedKey);
        return payload as unknown as JWTPayload;
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

        return await verifyToken(token);
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
