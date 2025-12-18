/**
 * ILAI Hyper Platform - WebSocket Sync Provider
 * 
 * Connects Yjs documents to the edge WebSocket server for real-time sync
 * Handles reconnection, awareness (cursors), and sync status
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Configuration
const EDGE_WS_URL = import.meta.env.VITE_EDGE_WS_URL || 'wss://ilai-api.workers.dev';

// Active providers
const providers = new Map();

/**
 * Create a WebSocket sync provider for a note
 * @param {string} noteId - The note identifier
 * @param {Y.Doc} doc - The Yjs document
 * @param {object} user - The current user { id, name, color }
 * @returns {WebsocketProvider}
 */
export function createSyncProvider(noteId, doc, user) {
    if (providers.has(noteId)) {
        return providers.get(noteId);
    }

    // Room name is used as the sync identifier
    const roomName = `note-${noteId}`;

    // y-websocket uses base URL - the room name is sent as a param
    // For custom edge server, we need to configure the WebSocket URL properly
    const wsUrl = EDGE_WS_URL;

    // Create WebSocket provider
    // Note: y-websocket appends the room to the URL as a parameter
    const provider = new WebsocketProvider(
        wsUrl,
        roomName,
        doc,
        {
            connect: true,
            // Custom params for authentication
            params: {
                userId: user.id,
                userName: user.name,
                noteId: noteId,
            },
        }
    );

    // Set user awareness (cursor, selection, name)
    provider.awareness.setLocalStateField('user', {
        id: user.id,
        name: user.name,
        color: user.color || generateUserColor(user.id),
        cursor: null,
    });

    // Connection event handlers
    provider.on('status', (event) => {
        console.log(`[Sync] Note ${noteId}:`, event.status);
    });

    provider.on('sync', (isSynced) => {
        console.log(`[Sync] Note ${noteId} synced:`, isSynced);
    });

    provider.on('connection-error', (error) => {
        console.error(`[Sync] Connection error for note ${noteId}:`, error);
    });

    providers.set(noteId, provider);
    return provider;
}

/**
 * Destroy a sync provider (cleanup on unmount)
 * @param {string} noteId - The note identifier
 */
export function destroySyncProvider(noteId) {
    const provider = providers.get(noteId);
    if (provider) {
        provider.destroy();
        providers.delete(noteId);
        console.log(`[Sync] Provider for note ${noteId} destroyed`);
    }
}

/**
 * Get sync status for a note
 * @param {string} noteId - The note identifier
 * @returns {{ connected: boolean, synced: boolean }}
 */
export function getSyncStatus(noteId) {
    const provider = providers.get(noteId);
    if (!provider) {
        return { connected: false, synced: false };
    }

    return {
        connected: provider.wsconnected,
        synced: provider.synced,
    };
}

/**
 * Get all connected users for a note (for cursor display)
 * @param {string} noteId - The note identifier
 * @returns {Array<{ id: string, name: string, color: string, cursor: any }>}
 */
export function getConnectedUsers(noteId) {
    const provider = providers.get(noteId);
    if (!provider) return [];

    const users = [];
    provider.awareness.getStates().forEach((state, clientId) => {
        if (state.user && clientId !== provider.awareness.clientID) {
            users.push({
                clientId,
                ...state.user,
            });
        }
    });

    return users;
}

/**
 * Update local user cursor position
 * @param {string} noteId - The note identifier
 * @param {object} cursor - Cursor position { anchor, head }
 */
export function updateCursor(noteId, cursor) {
    const provider = providers.get(noteId);
    if (provider) {
        provider.awareness.setLocalStateField('user', {
            ...provider.awareness.getLocalState()?.user,
            cursor,
        });
    }
}

/**
 * Subscribe to awareness changes (other users' cursors)
 * @param {string} noteId - The note identifier
 * @param {function} callback - Callback when awareness changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToAwareness(noteId, callback) {
    const provider = providers.get(noteId);
    if (!provider) return () => { };

    const handler = () => {
        callback(getConnectedUsers(noteId));
    };

    provider.awareness.on('change', handler);

    return () => {
        provider.awareness.off('change', handler);
    };
}

/**
 * Force reconnect for a note
 * @param {string} noteId - The note identifier
 */
export function reconnect(noteId) {
    const provider = providers.get(noteId);
    if (provider) {
        provider.disconnect();
        provider.connect();
    }
}

/**
 * Generate a consistent color for a user based on their ID
 * @param {string} userId - The user ID
 * @returns {string} Hex color code
 */
function generateUserColor(userId) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
    ];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

export default {
    createSyncProvider,
    destroySyncProvider,
    getSyncStatus,
    getConnectedUsers,
    updateCursor,
    subscribeToAwareness,
    reconnect,
};
