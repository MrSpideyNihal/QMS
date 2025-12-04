'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';

export default function NewTokenPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        customerName: '',
        phoneNumber: '',
        partySize: 1,
        type: 'walkin' as 'walkin' | 'reservation',
        reservationTime: '',
        shareConsent: false,
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/tokens', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create token');
            }

            toast.success(`Token ${data.token.tokenNumber} created successfully!`);
            router.push('/queue');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Create New Token</h1>
                    <p className="mt-2 text-gray-600">
                        Add a new customer to the waiting queue
                    </p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="customerName" className="label">
                                Customer Name *
                            </label>
                            <input
                                id="customerName"
                                type="text"
                                required
                                className="input"
                                placeholder="John Doe"
                                value={formData.customerName}
                                onChange={(e) =>
                                    setFormData({ ...formData, customerName: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label htmlFor="phoneNumber" className="label">
                                Phone Number *
                            </label>
                            <input
                                id="phoneNumber"
                                type="tel"
                                required
                                className="input"
                                placeholder="+1 234 567 8900"
                                value={formData.phoneNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, phoneNumber: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <label htmlFor="partySize" className="label">
                                Party Size *
                            </label>
                            <input
                                id="partySize"
                                type="number"
                                min="1"
                                max="20"
                                required
                                className="input"
                                value={formData.partySize}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        partySize: parseInt(e.target.value),
                                    })
                                }
                            />
                        </div>

                        <div>
                            <label htmlFor="type" className="label">
                                Type *
                            </label>
                            <select
                                id="type"
                                className="input"
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        type: e.target.value as 'walkin' | 'reservation',
                                    })
                                }
                            >
                                <option value="walkin">Walk-in</option>
                                <option value="reservation">Reservation</option>
                            </select>
                        </div>

                        {formData.type === 'reservation' && (
                            <div>
                                <label htmlFor="reservationTime" className="label">
                                    Reservation Time *
                                </label>
                                <input
                                    id="reservationTime"
                                    type="datetime-local"
                                    required
                                    className="input"
                                    value={formData.reservationTime}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reservationTime: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        )}

                        <div className="flex items-center">
                            <input
                                id="shareConsent"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                checked={formData.shareConsent}
                                onChange={(e) =>
                                    setFormData({ ...formData, shareConsent: e.target.checked })
                                }
                            />
                            <label
                                htmlFor="shareConsent"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Customer consents to shared seating
                            </label>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary flex-1"
                            >
                                {loading ? 'Creating...' : 'Create Token'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
