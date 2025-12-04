'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { useSocket, onTableUpdated } from '@/lib/useSocket';
import toast from 'react-hot-toast';

interface Table {
    _id: string;
    tableNumber: number;
    capacity: number;
    status: 'free' | 'occupied' | 'reserved' | 'shared';
    isJoinable: boolean;
    currentToken?: any;
}

export default function TablesPage() {
    const { isConnected } = useSocket();
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTable, setNewTable] = useState({
        tableNumber: '',
        capacity: 4,
        isJoinable: true,
    });

    useEffect(() => {
        fetchTables();

        const cleanup = onTableUpdated(() => {
            fetchTables();
        });

        return cleanup;
    }, []);

    const fetchTables = async () => {
        try {
            const response = await fetch('/api/tables');
            const data = await response.json();
            setTables(data.tables || []);
        } catch (error) {
            console.error('Failed to fetch tables:', error);
            toast.error('Failed to load tables');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTable = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTable),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create table');
            }

            toast.success('Table created successfully');
            setShowCreateModal(false);
            setNewTable({ tableNumber: '', capacity: 4, isJoinable: true });
            fetchTables();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create table');
        }
    };

    const handleUpdateStatus = async (tableId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/tables/${tableId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update table');

            toast.success('Table status updated');
            fetchTables();
        } catch (error) {
            toast.error('Failed to update table');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            free: 'table-free',
            occupied: 'table-occupied',
            reserved: 'table-reserved',
            shared: 'table-shared',
        };
        return colors[status] || 'bg-gray-500';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
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
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary"
                    >
                        Add Table
                    </button>
                </div>

                {/* Legend */}
                <div className="card mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Status Legend</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded table-free"></div>
                            <span className="text-sm">Free</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded table-occupied"></div>
                            <span className="text-sm">Occupied</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded table-reserved"></div>
                            <span className="text-sm">Reserved</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded table-shared"></div>
                            <span className="text-sm">Shared</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {tables.map((table) => (
                            <div
                                key={table._id}
                                className={`${getStatusColor(
                                    table.status
                                )} rounded-lg p-4 text-center cursor-pointer hover:opacity-90 transition-opacity`}
                                onClick={() => {
                                    const newStatus = prompt(
                                        `Change status for Table ${table.tableNumber} (free/occupied/reserved/shared):`,
                                        table.status
                                    );
                                    if (newStatus && ['free', 'occupied', 'reserved', 'shared'].includes(newStatus)) {
                                        handleUpdateStatus(table._id, newStatus);
                                    }
                                }}
                            >
                                <div className="text-2xl font-bold mb-2">
                                    {table.tableNumber}
                                </div>
                                <div className="text-sm opacity-90">
                                    Capacity: {table.capacity}
                                </div>
                                <div className="text-xs opacity-75 mt-1 capitalize">
                                    {table.status}
                                </div>
                                {table.currentToken && (
                                    <div className="text-xs opacity-75 mt-1">
                                        Token: {table.currentToken.tokenNumber}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Table Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="card max-w-md w-full mx-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Add New Table
                            </h2>
                            <form onSubmit={handleCreateTable} className="space-y-4">
                                <div>
                                    <label htmlFor="tableNumber" className="label">
                                        Table Number *
                                    </label>
                                    <input
                                        id="tableNumber"
                                        type="number"
                                        required
                                        className="input"
                                        value={newTable.tableNumber}
                                        onChange={(e) =>
                                            setNewTable({ ...newTable, tableNumber: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label htmlFor="capacity" className="label">
                                        Capacity *
                                    </label>
                                    <input
                                        id="capacity"
                                        type="number"
                                        min="1"
                                        required
                                        className="input"
                                        value={newTable.capacity}
                                        onChange={(e) =>
                                            setNewTable({
                                                ...newTable,
                                                capacity: parseInt(e.target.value),
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="isJoinable"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        checked={newTable.isJoinable}
                                        onChange={(e) =>
                                            setNewTable({ ...newTable, isJoinable: e.target.checked })
                                        }
                                    />
                                    <label
                                        htmlFor="isJoinable"
                                        className="ml-2 block text-sm text-gray-900"
                                    >
                                        Joinable (can be combined with other tables)
                                    </label>
                                </div>
                                <div className="flex space-x-4">
                                    <button type="submit" className="btn btn-primary flex-1">
                                        Create Table
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
