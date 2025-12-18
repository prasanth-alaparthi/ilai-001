/**
 * ILAI Hyper Platform - CRDT Document Store
 * 
 * Manages Yjs documents for local-first, offline-capable note editing
 * Each note gets its own Yjs document with:
 * - IndexedDB persistence (offline storage)
 * - WebSocket sync (real-time collaboration)
 * - Automatic conflict resolution via CRDTs
 */

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

// Store for active Yjs documents
const documents = new Map();
const persistences = new Map();

/**
 * Get or create a Yjs document for a note
 * @param {string} noteId - The unique note identifier
 * @returns {{ doc: Y.Doc, persistence: IndexeddbPersistence }}
 */
export function getOrCreateDoc(noteId) {
    if (documents.has(noteId)) {
        return {
            doc: documents.get(noteId),
            persistence: persistences.get(noteId),
        };
    }

    // Create new Yjs document
    const doc = new Y.Doc();

    // Enable IndexedDB persistence for offline support
    const persistence = new IndexeddbPersistence(`ilai-note-${noteId}`, doc);

    // Store references
    documents.set(noteId, doc);
    persistences.set(noteId, persistence);

    // Log sync status
    persistence.on('synced', () => {
        console.log(`[CRDT] Note ${noteId} synced from IndexedDB`);
    });

    return { doc, persistence };
}

/**
 * Destroy a Yjs document (cleanup on unmount)
 * @param {string} noteId - The note identifier
 */
export function destroyDoc(noteId) {
    const doc = documents.get(noteId);
    const persistence = persistences.get(noteId);

    if (persistence) {
        persistence.destroy();
        persistences.delete(noteId);
    }

    if (doc) {
        doc.destroy();
        documents.delete(noteId);
    }

    console.log(`[CRDT] Note ${noteId} cleaned up`);
}

/**
 * Get the XML fragment for TipTap editor
 * @param {Y.Doc} doc - The Yjs document
 * @returns {Y.XmlFragment}
 */
export function getEditorFragment(doc) {
    return doc.getXmlFragment('prosemirror');
}

/**
 * Check if a document has local changes not yet synced to server
 * @param {string} noteId - The note identifier
 * @returns {boolean}
 */
export function hasUnsyncedChanges(noteId) {
    const doc = documents.get(noteId);
    if (!doc) return false;

    // Check if document has pending updates
    const state = Y.encodeStateVector(doc);
    return state.length > 0;
}

/**
 * Export document state for backup/transfer
 * @param {string} noteId - The note identifier
 * @returns {Uint8Array | null}
 */
export function exportDocState(noteId) {
    const doc = documents.get(noteId);
    if (!doc) return null;

    return Y.encodeStateAsUpdate(doc);
}

/**
 * Import document state from backup/transfer
 * @param {string} noteId - The note identifier
 * @param {Uint8Array} state - The encoded state
 */
export function importDocState(noteId, state) {
    const { doc } = getOrCreateDoc(noteId);
    Y.applyUpdate(doc, state);
}

/**
 * Get awareness (cursor positions, user presence) for a document
 * @param {Y.Doc} doc - The Yjs document
 * @returns {object}
 */
export function createAwareness(doc) {
    // Awareness is typically created by y-websocket provider
    // This is a placeholder for manual awareness management
    return {
        setLocalState: (state) => {
            // Will be implemented with WebSocket provider
        },
        getStates: () => new Map(),
    };
}

export default {
    getOrCreateDoc,
    destroyDoc,
    getEditorFragment,
    hasUnsyncedChanges,
    exportDocState,
    importDocState,
    createAwareness,
};
