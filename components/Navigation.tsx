'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface User {
    email: string;
    role: 'developer' | 'admin' | 'staff';
}

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await fetch('/api/auth/me');
            const data = await response.json();
            if (data.user) {
                setUser(data.user);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', roles: ['staff', 'admin', 'developer'] },
        { href: '/queue', label: 'Queue', roles: ['staff', 'admin', 'developer'] },
        { href: '/tables', label: 'Tables', roles: ['staff', 'admin', 'developer'] },
        { href: '/tokens/new', label: 'New Token', roles: ['staff', 'admin', 'developer'] },
        { href: '/analytics', label: 'Analytics', roles: ['admin', 'developer'] },
        { href: '/settings', label: 'Settings', roles: ['admin', 'developer'] },
        { href: '/logs', label: 'Logs', roles: ['admin', 'developer'] },
        { href: '/dev', label: 'Developer', roles: ['developer'] },
    ];

    const filteredNavItems = navItems.filter((item) =>
        user ? item.roles.includes(user.role) : false
    );

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/dashboard" className="text-xl font-bold text-primary-600">
                                QMS
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                            {filteredNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === item.href
                                            ? 'text-primary-600 bg-primary-50'
                                            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {user && (
                            <>
                                <div className="text-sm">
                                    <div className="font-medium text-gray-900">{user.email}</div>
                                    <div className="text-gray-500 capitalize">{user.role}</div>
                                </div>
                                <button onClick={handleLogout} className="btn btn-secondary text-sm">
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className="sm:hidden border-t border-gray-200">
                <div className="px-2 pt-2 pb-3 space-y-1">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === item.href
                                    ? 'text-primary-600 bg-primary-50'
                                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
