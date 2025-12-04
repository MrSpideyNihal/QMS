'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';

interface Settings {
    _id: string;
    gracePeriodMinutes: number;
    autoRefresh: boolean;
    operatingHours: {
        open: string;
        close: string;
    };
    avgSeatTimeMinutes: number;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            setSettings(data.settings);
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error('Failed to update settings');
            }

            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="card text-center py-12">
                        <p className="text-gray-500">Settings not found</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                    <p className="mt-2 text-gray-600">
                        Configure queue management system parameters
                    </p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="gracePeriodMinutes" className="label">
                                Grace Period (minutes)
                            </label>
                            <input
                                id="gracePeriodMinutes"
                                type="number"
                                min="0"
                                className="input"
                                value={settings.gracePeriodMinutes}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        gracePeriodMinutes: parseInt(e.target.value),
                                    })
                                }
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Time to wait before auto-canceling late reservations
                            </p>
                        </div>

                        <div>
                            <label htmlFor="avgSeatTimeMinutes" className="label">
                                Average Seat Time (minutes)
                            </label>
                            <input
                                id="avgSeatTimeMinutes"
                                type="number"
                                min="1"
                                className="input"
                                value={settings.avgSeatTimeMinutes}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        avgSeatTimeMinutes: parseInt(e.target.value),
                                    })
                                }
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Average time customers spend seated (used for wait time estimation)
                            </p>
                        </div>

                        <div>
                            <label htmlFor="openTime" className="label">
                                Opening Time
                            </label>
                            <input
                                id="openTime"
                                type="time"
                                className="input"
                                value={settings.operatingHours.open}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        operatingHours: {
                                            ...settings.operatingHours,
                                            open: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label htmlFor="closeTime" className="label">
                                Closing Time
                            </label>
                            <input
                                id="closeTime"
                                type="time"
                                className="input"
                                value={settings.operatingHours.close}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        operatingHours: {
                                            ...settings.operatingHours,
                                            close: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="autoRefresh"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                checked={settings.autoRefresh}
                                onChange={(e) =>
                                    setSettings({ ...settings, autoRefresh: e.target.checked })
                                }
                            />
                            <label
                                htmlFor="autoRefresh"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Enable automatic queue refresh
                            </label>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn btn-primary w-full"
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 card bg-warning-50">
                    <h3 className="font-semibold text-warning-900 mb-2">⚠️ Important Notes</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-warning-800">
                        <li>Changes take effect immediately</li>
                        <li>Grace period affects reservation timeout behavior</li>
                        <li>Average seat time impacts wait time estimates</li>
                        <li>Operating hours are for reference only (not enforced)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
