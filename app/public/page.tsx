'use client';

import { useEffect, useState } from 'react';
import { useSocket, onQueueChanged } from '@/lib/useSocket';

interface Token {
    tokenNumber: string;
    partySize: number;
    estimatedWaitTime: number;
    queuePosition: number;
}

interface TableStats {
    free: number;
    occupied: number;
    shared: number;
    reserved: number;
}

export default function PublicDisplayPage() {
    const { isConnected } = useSocket();
    const [tokens, setTokens] = useState<Token[]>([]);
    const [tableStats, setTableStats] = useState<TableStats>({
        free: 0,
        occupied: 0,
        shared: 0,
        reserved: 0,
    });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);

        // Update clock every second
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const cleanup = onQueueChanged(() => {
            fetchData();
        });

        return () => {
            clearInterval(interval);
            clearInterval(clockInterval);
            if (cleanup) cleanup();
        };
    }, []);

    const fetchData = async () => {
        try {
            const [tokensRes, tablesRes] = await Promise.all([
                fetch('/api/tokens?status=waiting'),
                fetch('/api/tables'),
            ]);

            const tokensData = await tokensRes.json();
            const tablesData = await tablesRes.json();

            setTokens(tokensData.tokens || []);

            const tables = tablesData.tables || [];
            const stats = {
                free: tables.filter((t: any) => t.status === 'free').length,
                occupied: tables.filter((t: any) => t.status === 'occupied').length,
                shared: tables.filter((t: any) => t.status === 'shared').length,
                reserved: tables.filter((t: any) => t.status === 'reserved').length,
            };
            setTableStats(stats);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold mb-4">Queue Status</h1>
                    <div className="text-3xl opacity-90">
                        {currentTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })}
                    </div>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                        <div
                            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success-500 animate-pulse' : 'bg-gray-400'
                                }`}
                        />
                        <span className="text-lg">
                            {isConnected ? 'Live Updates' : 'Connecting...'}
                        </span>
                    </div>
                </div>

                {/* Table Availability */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 text-center">
                        <div className="text-5xl font-bold mb-2">{tableStats.free}</div>
                        <div className="text-xl opacity-90">Free Tables</div>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 text-center">
                        <div className="text-5xl font-bold mb-2">{tableStats.occupied}</div>
                        <div className="text-xl opacity-90">Occupied</div>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 text-center">
                        <div className="text-5xl font-bold mb-2">{tableStats.shared}</div>
                        <div className="text-xl opacity-90">Shared</div>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 text-center">
                        <div className="text-5xl font-bold mb-2">{tableStats.reserved}</div>
                        <div className="text-xl opacity-90">Reserved</div>
                    </div>
                </div>

                {/* Queue */}
                <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-8">
                    <h2 className="text-4xl font-bold mb-8 text-center">
                        Waiting Queue ({tokens.length})
                    </h2>

                    {tokens.length === 0 ? (
                        <div className="text-center text-3xl opacity-75 py-12">
                            No customers waiting
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {tokens.slice(0, 10).map((token, index) => (
                                <div
                                    key={token.tokenNumber}
                                    className={`bg-white bg-opacity-30 backdrop-blur rounded-xl p-6 flex items-center justify-between ${index === 0 ? 'ring-4 ring-yellow-400 animate-pulse-slow' : ''
                                        }`}
                                >
                                    <div className="flex items-center space-x-6">
                                        <div className="text-5xl font-bold w-16 text-center">
                                            {token.queuePosition}
                                        </div>
                                        <div>
                                            <div className="text-3xl font-bold">
                                                {token.tokenNumber}
                                            </div>
                                            <div className="text-xl opacity-90">
                                                Party of {token.partySize}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold">
                                            {token.estimatedWaitTime}
                                        </div>
                                        <div className="text-xl opacity-90">minutes</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-lg opacity-75">
                    <p>Please wait for your token to be called</p>
                    <p className="mt-2">Thank you for your patience!</p>
                </div>
            </div>
        </div>
    );
}
