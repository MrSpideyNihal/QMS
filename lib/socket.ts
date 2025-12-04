// Simplified socket utilities for Netlify - no Socket.io server
// These are placeholder functions since we're using polling instead

export function initSocketIO() {
    // No-op for Netlify
    return null;
}

export function emitQueueChanged() {
    // No-op - polling handles updates
}

export function emitTokenUpdated(tokenId: string) {
    // No-op - polling handles updates
}

export function emitTableUpdated(tableId: string) {
    // No-op - polling handles updates
}
