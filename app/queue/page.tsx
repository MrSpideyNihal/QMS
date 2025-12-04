'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { useSocket, onQueueChanged } from '@/lib/useSocket';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Token {
    _id: string;
    tokenNumber: string;
    customerName: string;
    phoneNumber: string;
    partySize: number;
    type: 'walkin' | 'reservation';
    status: 'waiting' | 'seated' | 'cancelled' | 'completed';
    queuePosition: number;
    estimatedWaitTime: number;
    reservationTime?: string;
    createdAt: string;
}

interface Table {
    _id: string;
    tableNumber: number;
    capacity: number;
    status: string;
}

export default function QueuePage() {
    const { isConnected } = useSocket();
    const [tokens, setTokens] = useState<Token[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('waiting');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [selectedTableId, setSelectedTableId] = useState('');

    useEffect(() => {
        fetchTokens();
        fetchTables();

        const cleanup = onQueueChanged(() => {
            fetchTokens();
            fetchTables();
        });

        return cleanup;
    }, [filter]);

    const fetchTokens = async () => {
        try {
            const response = await fetch(`/api/tokens?status=${filter}`);
            const data = await response.json();
            setTokens(data.tokens || []);
        } catch (error) {
            console.error('Failed to fetch tokens:', error);
            toast.error('Failed to load queue');
        } finally {
            setLoading(false);
        }
    };

    const fetchTables = async () => {
        try {
            const response = await fetch('/api/tables');
            const data = await response.json();
            setTables(data.tables || []);
        } catch (error) {
            console.error('Failed to fetch tables:', error);
        }
    };

    const handleCancelToken = async (tokenId: string) => {
        if (!confirm('Are you sure you want to cancel this token?')) return;

        try {
            const response = await fetch(`/api/tokens/${tokenId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to cancel token');

            toast.success('Token cancelled successfully');
            fetchTokens();
        } catch (error) {
            toast.error('Failed to cancel token');
        }
    };

    const handleCompleteToken = async (tokenId: string) => {
        if (!confirm('Mark this token as completed?')) return;

        try {
            const response = await fetch(`/api/tokens/${tokenId}/complete`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to complete token');

            toast.success('Token completed successfully');
            fetchTokens();
        } catch (error) {
            toast.error('Failed to complete token');
        }
    };

    const openAssignModal = (token: Token) => {
        setSelectedToken(token);
        setShowAssignModal(true);
        setSelectedTableId('');
    };

    const handleAssignTable = async () => {
        if (!selectedToken || !selectedTableId) {
            toast.error('Please select a table');
            return;
        }

        try {
            const response = await fetch(`/api/tokens/${selectedToken._id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tableIds: [selectedTableId],
                    assignmentType: 'single',
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to assign table');
            }

            toast.success('Table assigned successfully');
            setShowAssignModal(false);
            setSelectedToken(null);
            fetchTokens();
            fetchTables();
        } catch (error: any) {
            toast.error(error.message || 'Failed to assign table');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            waiting: 'badge-waiting',
            seated: 'badge-seated',
            completed: 'badge-completed',
            cancelled: 'badge-cancelled',
        };
        return badges[status] || 'badge';
    };

    const getAvailableTables = () => {
        return tables.filter((t) => t.status === 'free');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
                        <div className="mt-2 flex items-center space-x-2">
                            <div
                                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'
                                    }`}
                            />
                            <p className="text-sm text-gray-600">
                                {isConnected ? 'Real-time updates active' : 'Connecting...'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="flex flex-wrap gap-2">
                        {['waiting', 'seated', 'completed', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : tokens.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-gray-500">No tokens found</p>
                    </div>
                ) : (
                    <div className="card overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Token
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Party Size
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Queue Position
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Est. Wait
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tokens.map((token) => (
                                    <tr key={token._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {token.tokenNumber}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(token.createdAt), 'MMM d, HH:mm')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {token.customerName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {token.phoneNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {token.partySize}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm capitalize">{token.type}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge ${getStatusBadge(token.status)}`}>
                                                {token.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {token.status === 'waiting' ? token.queuePosition : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {token.status === 'waiting'
                                                ? `${token.estimatedWaitTime} min`
                                                : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            {token.status === 'waiting' && (
                                                <>
                                                    <button
                                                        onClick={() => openAssignModal(token)}
                                                        className="text-blue-600 hover:text-blue-900 font-medium"
                                                    >
                                                        Assign
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelToken(token._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            {token.status === 'seated' && (
                                                <button
                                                    onClick={() => handleCompleteToken(token._id)}
                                                    className="text-green-600 hover:text-green-900 font-medium"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assign Table Modal */}
            {showAssignModal && selectedToken && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Assign Table to {selectedToken.tokenNumber}
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Customer: {selectedToken.customerName} | Party Size:{' '}
                            {selectedToken.partySize}
                        </p>

                        <div className="mb-6">
                            <label className="label">Select Available Table</label>
                            <select
                                className="input"
                                value={selectedTableId}
                                onChange={(e) => setSelectedTableId(e.target.value)}
                            >
                                <option value="">-- Select a table --</option>
                                {getAvailableTables().map((table) => (
                                    <option key={table._id} value={table._id}>
                                        Table {table.tableNumber} (Capacity: {table.capacity})
                                    </option>
                                ))}
                            </select>
                            {getAvailableTables().length === 0 && (
                                <p className="text-sm text-red-600 mt-2">
                                    No free tables available
                                </p>
                            )}
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={handleAssignTable}
                                disabled={!selectedTableId}
                                className="btn btn-primary flex-1"
                            >
                                Assign Table
                            </button>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedToken(null);
                                }}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
