// Simplified hook for Netlify - uses polling instead of Socket.io
import { useEffect, useState } from 'react';

export function useSocket() {
    const [isConnected, setIsConnected] = useState(true);

    return { isConnected };
}

// Polling-based event listeners
export function onQueueChanged(callback: () => void) {
    // Set up polling every 5 seconds
    const interval = setInterval(callback, 5000);

    return () => clearInterval(interval);
}

export function onTokenUpdated(callback: () => void) {
    const interval = setInterval(callback, 5000);

    return () => clearInterval(interval);
}

export function onTableUpdated(callback: () => void) {
    const interval = setInterval(callback, 5000);

    return () => clearInterval(interval);
}
