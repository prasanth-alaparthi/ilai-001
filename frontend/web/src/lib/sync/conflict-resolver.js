/**
 * ILAI Hyper Platform - Conflict Resolver
 * 
 * Smart merge strategies for CRDT conflicts
 * Handles edge cases that CRDTs don't automatically resolve
 */

import * as Y from 'yjs';

/**
 * Conflict types that may require user intervention
 */
export const ConflictType = {
    CONCURRENT_DELETE: 'concurrent_delete',
    STRUCTURE_MISMATCH: 'structure_mismatch',
    VERSION_CONFLICT: 'version_conflict',
};

/**
 * Conflict resolution strategies
 */
export const ResolutionStrategy = {
    KEEP_REMOTE: 'keep_remote',
    KEEP_LOCAL: 'keep_local',
    MERGE_BOTH: 'merge_both',
    ASK_USER: 'ask_user',
};

/**
 * Detect conflicts between local and remote states
 * @param {Y.Doc} localDoc - Local Yjs document
 * @param {Uint8Array} remoteUpdate - Remote update from server
 * @returns {{ hasConflict: boolean, type?: string, details?: object }}
 */
export function detectConflicts(localDoc, remoteUpdate) {
    try {
        // Create temporary doc to apply remote update
        const tempDoc = new Y.Doc();
        const localState = Y.encodeStateAsUpdate(localDoc);

        Y.applyUpdate(tempDoc, localState);
        Y.applyUpdate(tempDoc, remoteUpdate);

        // Compare state vectors
        const localStateVector = Y.encodeStateVector(localDoc);
        const remoteStateVector = Y.encodeStateVector(tempDoc);

        // Check for divergent state (both have changes the other doesn't)
        const localHasUnique = !Y.encodeStateAsUpdate(localDoc, remoteStateVector).every((byte, i) => byte === 0);
        const remoteHasUnique = !remoteUpdate.every((byte, i) => byte === 0);

        if (localHasUnique && remoteHasUnique) {
            return {
                hasConflict: true,
                type: ConflictType.CONCURRENT_DELETE,
                details: {
                    localChanges: localHasUnique,
                    remoteChanges: remoteHasUnique,
                },
            };
        }

        tempDoc.destroy();
        return { hasConflict: false };
    } catch (error) {
        console.error('[Conflict] Detection error:', error);
        return {
            hasConflict: true,
            type: ConflictType.STRUCTURE_MISMATCH,
            details: { error: error.message },
        };
    }
}

/**
 * Resolve conflicts based on strategy
 * @param {Y.Doc} localDoc - Local document
 * @param {Uint8Array} remoteUpdate - Remote update
 * @param {string} strategy - Resolution strategy
 * @returns {{ resolved: boolean, resultDoc?: Y.Doc }}
 */
export function resolveConflict(localDoc, remoteUpdate, strategy = ResolutionStrategy.MERGE_BOTH) {
    switch (strategy) {
        case ResolutionStrategy.KEEP_LOCAL:
            // Don't apply remote update, keep local state
            return { resolved: true, resultDoc: localDoc };

        case ResolutionStrategy.KEEP_REMOTE:
            // Apply remote update, potentially overwriting local changes
            Y.applyUpdate(localDoc, remoteUpdate);
            return { resolved: true, resultDoc: localDoc };

        case ResolutionStrategy.MERGE_BOTH:
            // Let CRDT handle the merge (default behavior)
            try {
                Y.applyUpdate(localDoc, remoteUpdate);
                return { resolved: true, resultDoc: localDoc };
            } catch (error) {
                console.error('[Conflict] Merge failed:', error);
                return { resolved: false };
            }

        case ResolutionStrategy.ASK_USER:
            // Return unresolved, let UI handle it
            return { resolved: false, pendingUpdate: remoteUpdate };

        default:
            return { resolved: false };
    }
}

/**
 * Create a conflict snapshot for user review
 * @param {Y.Doc} localDoc - Local document
 * @param {Uint8Array} remoteUpdate - Remote update
 * @returns {{ localContent: string, remoteContent: string }}
 */
export function createConflictSnapshot(localDoc, remoteUpdate) {
    const localContent = extractTextContent(localDoc);

    // Create temp doc with remote state
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, Y.encodeStateAsUpdate(localDoc));
    Y.applyUpdate(tempDoc, remoteUpdate);
    const remoteContent = extractTextContent(tempDoc);
    tempDoc.destroy();

    return {
        localContent,
        remoteContent,
        timestamp: Date.now(),
    };
}

/**
 * Extract text content from Yjs document for comparison
 */
function extractTextContent(doc) {
    try {
        const fragment = doc.getXmlFragment('prosemirror');
        return fragment.toString();
    } catch {
        return '';
    }
}

/**
 * Save conflict for later resolution
 */
export function saveConflictForLater(noteId, conflictData) {
    const conflicts = JSON.parse(localStorage.getItem('ilai_conflicts') || '{}');
    conflicts[noteId] = {
        ...conflictData,
        savedAt: Date.now(),
    };
    localStorage.setItem('ilai_conflicts', JSON.stringify(conflicts));
}

/**
 * Get pending conflicts for a note
 */
export function getPendingConflict(noteId) {
    const conflicts = JSON.parse(localStorage.getItem('ilai_conflicts') || '{}');
    return conflicts[noteId] || null;
}

/**
 * Clear resolved conflict
 */
export function clearConflict(noteId) {
    const conflicts = JSON.parse(localStorage.getItem('ilai_conflicts') || '{}');
    delete conflicts[noteId];
    localStorage.setItem('ilai_conflicts', JSON.stringify(conflicts));
}

export default {
    ConflictType,
    ResolutionStrategy,
    detectConflicts,
    resolveConflict,
    createConflictSnapshot,
    saveConflictForLater,
    getPendingConflict,
    clearConflict,
};
