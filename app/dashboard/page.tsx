'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { useSocket, onQueueChanged } from '@/lib/useSocket';
import Link from 'next/link';

interface Stats {
    waiting: number;
    seated: number;
    completed: number;
    freeTables: number;
    occupiedTables: number;
}

export default function DashboardPage() {
    const { isConnected } = useSocket();
    const [stats, setStats] = useState<Stats>({
        waiting: 0,
        seated: 0,
        completed: 0,
        freeTables: 0,
        occupiedTables: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        const cleanup = onQueueChanged(() => {
            fetchStats();
        });

        return cleanup;
    }, []);

    const fetchStats = async () => {
        try {
            const [tokensRes, tablesRes] = await Promise.all([
                fetch('/api/tokens'),
                fetch('/api/tables'),
            ]);

            const tokensData = await tokensRes.json();
            const tablesData = await tablesRes.json();

            const tokens = tokensData.tokens || [];
            const tables = tablesData.tables || [];

            setStats({
                waiting: tokens.filter((t: any) => t.status === 'waiting').length,
                seated: tokens.filter((t: any) => t.status === 'seated').length,
                completed: tokens.filter((t: any) => t.status === 'completed').length,
                freeTables: tables.filter((t: any) => t.status === 'free').length,
                occupiedTables: tables.filter(
                    (t: any) => t.status === 'occupied' || t.status === 'shared'
                ).length,
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Waiting',
            value: stats.waiting,
            color: 'bg-warning-500',
            textColor: 'text-warning-600',
            bgColor: 'bg-warning-50',
            link: '/queue',
        },
        {
            title: 'Seated',
            value: stats.seated,
            color: 'bg-primary-500',
            textColor: 'text-primary-600',
            bgColor: 'bg-primary-50',
            link: '/queue',
        },
        {
            title: 'Completed Today',
            value: stats.completed,
            color: 'bg-success-500',
            textColor: 'text-success-600',
            bgColor: 'bg-success-50',
            link: '/queue',
        },
        {
            title: 'Free Tables',
            value: stats.freeTables,
            color: 'bg-success-500',
            textColor: 'text-success-600',
            bgColor: 'bg-success-50',
            link: '/tables',
        },
        {
            title: 'Occupied Tables',
            value: stats.occupiedTables,
            color: 'bg-danger-500',
            textColor: 'text-danger-600',
            bgColor: 'bg-danger-50',
            link: '/tables',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <div className="mt-2 flex items-center space-x-2">
                        <div
                            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-gray-400'
                                }`}
                        />
                        <p className="text-sm text-gray-600">
                            {isConnected ? 'Real-time updates active' : 'Connecting...'}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        <p className="mt-4 text-gray-600">Loading dashboard...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                            {statCards.map((stat) => (
                                <Link key={stat.title} href={stat.link}>
                                    <div className={`card ${stat.bgColor} hover:shadow-lg transition-shadow cursor-pointer`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">
                                                    {stat.title}
                                                </p>
                                                <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>
                                                    {stat.value}
                                                </p>
                                            </div>
                                            <div className={`w-12 h-12 ${stat.color} rounded-full`}></div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Quick Actions
                                </h2>
                                <div className="space-y-3">
                                    <Link href="/tokens/new" className="block">
                                        <button className="btn btn-primary w-full">
                                            Create New Token
                                        </button>
                                    </Link>
                                    <Link href="/queue" className="block">
                                        <button className="btn btn-secondary w-full">
                                            View Queue
                                        </button>
                                    </Link>
                                    <Link href="/tables" className="block">
                                        <button className="btn btn-secondary w-full">
                                            Manage Tables
                                        </button>
                                    </Link>
                                    <Link href="/public" className="block">
                                        <button className="btn btn-secondary w-full">
                                            Public Display
                                        </button>
                                    </Link>
                                </div>
                            </div>

                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    System Status
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Real-time Updates</span>
                                        <span
                                            className={`badge ${isConnected ? 'badge-seated' : 'badge-cancelled'
                                                }`}
                                        >
                                            {isConnected ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Total Capacity</span>
                                        <span className="font-semibold text-gray-900">
                                            {stats.freeTables + stats.occupiedTables} tables
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Utilization</span>
                                        <span className="font-semibold text-gray-900">
                                            {stats.freeTables + stats.occupiedTables > 0
                                                ? Math.round(
                                                    (stats.occupiedTables /
                                                        (stats.freeTables + stats.occupiedTables)) *
                                                    100
                                                )
                                                : 0}
                                            %
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
