'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';

interface User {
    _id: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function DeveloperPage() {
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        role: 'staff',
    });

    const fetchStats = async () => {
        try {
            const [tokensRes, tablesRes, logsRes] = await Promise.all([
                fetch('/api/tokens'),
                fetch('/api/tables'),
                fetch('/api/logs'),
            ]);

            const tokens = await tokensRes.json();
            const tables = await tablesRes.json();
            const logs = await logsRes.json();

            setStats({
                totalTokens: tokens.tokens?.length || 0,
                totalTables: tables.tables?.length || 0,
                totalLogs: logs.logs?.length || 0,
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create user');
            }

            toast.success('User created successfully');
            setShowCreateUser(false);
            setNewUser({ email: '', password: '', role: 'staff' });
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAssign = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/queue/auto-assign', {
                method: 'POST',
            });
            const data = await response.json();
            toast.success(`Auto-assigned ${data.assignedCount} token(s)`);
            fetchStats();
        } catch (error) {
            toast.error('Auto-assignment failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckTimeouts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/queue/check-timeouts', {
                method: 'POST',
            });
            const data = await response.json();
            toast.success(`Processed ${data.timeoutCount} timeout(s)`);
            fetchStats();
        } catch (error) {
            toast.error('Timeout check failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Developer Tools</h1>
                    <p className="mt-2 text-gray-600">
                        Advanced system management and user administration
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-blue-50">
                        <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            {stats?.totalTokens || 0}
                        </p>
                    </div>
                    <div className="card bg-green-50">
                        <p className="text-sm font-medium text-gray-600">Total Tables</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {stats?.totalTables || 0}
                        </p>
                    </div>
                    <div className="card bg-yellow-50">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-2">
                            {users.length}
                        </p>
                    </div>
                </div>

                {/* User Management */}
                <div className="card mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            User Management
                        </h2>
                        <button
                            onClick={() => setShowCreateUser(!showCreateUser)}
                            className="btn btn-primary"
                        >
                            + Create User
                        </button>
                    </div>

                    {/* Create User Form */}
                    {showCreateUser && (
                        <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-4">Create New User</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="input"
                                        value={newUser.email}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, email: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="label">Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="input"
                                        value={newUser.password}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, password: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="label">Role</label>
                                    <select
                                        className="input"
                                        value={newUser.role}
                                        onChange={(e) =>
                                            setNewUser({ ...newUser, role: e.target.value })
                                        }
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                        <option value="developer">Developer</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-2 mt-4">
                                <button type="submit" disabled={loading} className="btn btn-success">
                                    Create User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateUser(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Users List */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Created
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`badge ${user.role === 'developer'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : user.role === 'admin'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={handleAutoAssign}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            🤖 Auto-Assign Tables
                        </button>
                        <button
                            onClick={handleCheckTimeouts}
                            disabled={loading}
                            className="btn btn-warning"
                        >
                            ⏰ Check Timeouts
                        </button>
                        <button
                            onClick={fetchStats}
                            disabled={loading}
                            className="btn btn-secondary"
                        >
                            🔄 Refresh Stats
                        </button>
                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className="btn btn-secondary"
                        >
                            👥 Refresh Users
                        </button>
                    </div>
                </div>

                {/* API Endpoints */}
                <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Useful API Endpoints
                    </h2>
                    <div className="space-y-2 text-sm">
                        <div className="bg-gray-50 p-3 rounded">
                            <code className="text-blue-600">POST /api/queue/auto-assign</code>
                            <p className="text-gray-600 mt-1">Auto-assign tables to waiting tokens</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                            <code className="text-blue-600">POST /api/queue/check-timeouts</code>
                            <p className="text-gray-600 mt-1">Check and cancel late reservations</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                            <code className="text-blue-600">POST /api/auth/register</code>
                            <p className="text-gray-600 mt-1">Create new user account</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
