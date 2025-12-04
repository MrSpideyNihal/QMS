'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

interface AnalyticsData {
    date: string;
    hour: number;
    tokenCount: number;
    peakHour: boolean;
    avgWaitTime: number;
    shareConsentCount: number;
}

interface Summary {
    totalTokens: number;
    avgWaitTime: number;
    peakHoursCount: number;
    shareConsentTotal: number;
    shareConsentRate: string;
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(
                `/api/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch analytics');
            }

            setAnalytics(data.analytics || []);
            setSummary(data.summary || null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const hourlyData = analytics.map((a) => ({
        hour: `${a.hour}:00`,
        tokens: a.tokenCount,
        avgWait: a.avgWaitTime || 0,
    }));

    const shareConsentData = summary
        ? [
            { name: 'With Consent', value: summary.shareConsentTotal },
            { name: 'Without Consent', value: summary.totalTokens - summary.shareConsentTotal },
        ]
        : [];

    const COLORS = ['#0ea5e9', '#94a3b8'];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                    <p className="mt-2 text-gray-600">Customer flow and queue statistics</p>
                </div>

                {/* Date Range Filter */}
                <div className="card mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="startDate" className="label">
                                Start Date
                            </label>
                            <input
                                id="startDate"
                                type="date"
                                className="input"
                                value={dateRange.startDate}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, startDate: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="label">
                                End Date
                            </label>
                            <input
                                id="endDate"
                                type="date"
                                className="input"
                                value={dateRange.endDate}
                                onChange={(e) =>
                                    setDateRange({ ...dateRange, endDate: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex items-end">
                            <button onClick={fetchAnalytics} className="btn btn-primary w-full">
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="card bg-primary-50">
                                    <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                                    <p className="text-3xl font-bold text-primary-600 mt-2">
                                        {summary.totalTokens}
                                    </p>
                                </div>
                                <div className="card bg-warning-50">
                                    <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
                                    <p className="text-3xl font-bold text-warning-600 mt-2">
                                        {summary.avgWaitTime} min
                                    </p>
                                </div>
                                <div className="card bg-success-50">
                                    <p className="text-sm font-medium text-gray-600">Peak Hours</p>
                                    <p className="text-3xl font-bold text-success-600 mt-2">
                                        {summary.peakHoursCount}
                                    </p>
                                </div>
                                <div className="card bg-primary-50">
                                    <p className="text-sm font-medium text-gray-600">Share Consent Rate</p>
                                    <p className="text-3xl font-bold text-primary-600 mt-2">
                                        {summary.shareConsentRate}%
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Hourly Traffic */}
                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Hourly Traffic
                                </h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={hourlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="tokens" fill="#0ea5e9" name="Tokens" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Average Wait Time */}
                            <div className="card">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Average Wait Time
                                </h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={hourlyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="avgWait"
                                            stroke="#f59e0b"
                                            name="Avg Wait (min)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Share Consent Distribution */}
                            {shareConsentData.length > 0 && (
                                <div className="card">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Share Consent Distribution
                                    </h2>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={shareConsentData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${entry.value}`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {shareConsentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
