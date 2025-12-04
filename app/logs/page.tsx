'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Log {
    _id: string;
    action: string;
    performedBy: string;
    tokenId?: any;
    tableId?: any;
    reason: string;
    timestamp: string;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        action: '',
        startDate: '',
        endDate: '',
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page, filter]);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                ...(filter.action && { action: filter.action }),
                ...(filter.startDate && { startDate: filter.startDate }),
                ...(filter.endDate && { endDate: filter.endDate }),
            });

            const response = await fetch(`/api/logs?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch logs');
            }

            setLogs(data.logs || []);
            setTotalPages(data.pagination?.pages || 1);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilter({ ...filter, [key]: value });
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Override Logs</h1>
                    <p className="mt-2 text-gray-600">
                        Track all manual interventions and system actions
                    </p>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label htmlFor="action" className="label">
                                Action Type
                            </label>
                            <select
                                id="action"
                                className="input"
                                value={filter.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                            >
                                <option value="">All Actions</option>
                                <option value="manual_assign">Manual Assign</option>
                                <option value="manual_reorder">Manual Reorder</option>
                                <option value="cancel_token">Cancel Token</option>
                                <option value="complete_token">Complete Token</option>
                                <option value="auto_timeout">Auto Timeout</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="startDate" className="label">
                                Start Date
                            </label>
                            <input
                                id="startDate"
                                type="date"
                                className="input"
                                value={filter.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
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
                                value={filter.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <button onClick={fetchLogs} className="btn btn-primary w-full">
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-gray-500">No logs found</p>
                    </div>
                ) : (
                    <>
                        <div className="card overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Timestamp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Action
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Performed By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Token
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Table
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Reason
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="badge badge-seated">
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.performedBy}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.tokenId?.tokenNumber || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.tableId?.tableNumber || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {log.reason}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex justify-center space-x-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="btn btn-secondary disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="flex items-center px-4 text-gray-700">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className="btn btn-secondary disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
