/**
 * ILAI Hyper Platform - IndexedDB Provider
 * 
 * Enhanced wrapper around y-indexeddb for better control
 * Handles offline persistence, data recovery, and storage management
 */

import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';

// Storage quota management
const MAX_STORAGE_MB = 100;
const CLEANUP_THRESHOLD_MB = 80;

/**
 * Enhanced IndexedDB provider with additional features
 */
export class EnhancedIndexedDBProvider {
    constructor(noteId, doc, options = {}) {
        this.noteId = noteId;
        this.doc = doc;
        this.options = {
            dbName: `ilai-note-${noteId}`,
            autoCleanup: true,
            ...options,
        };

        this.persistence = null;
        this.isReady = false;
        this.onSyncCallbacks = [];
        this.onErrorCallbacks = [];
    }

    /**
     * Initialize the IndexedDB persistence
     */
    async init() {
        try {
            // Check storage quota before initializing
            await this.checkStorageQuota();

            // Create persistence provider
            this.persistence = new IndexeddbPersistence(this.options.dbName, this.doc);

            // Set up event handlers
            this.persistence.on('synced', () => {
                this.isReady = true;
                console.log(`[IndexedDB] Note ${this.noteId} synced from local storage`);
                this.onSyncCallbacks.forEach(cb => cb());
            });

            // Wait for initial sync
            await this.waitForSync();

            return true;
        } catch (error) {
            console.error(`[IndexedDB] Failed to initialize for note ${this.noteId}:`, error);
            this.onErrorCallbacks.forEach(cb => cb(error));
            return false;
        }
    }

    /**
     * Wait for initial sync to complete
     */
    waitForSync() {
        return new Promise((resolve) => {
            if (this.isReady) {
                resolve();
                return;
            }

            this.onSyncCallbacks.push(resolve);
        });
    }

    /**
     * Register sync callback
     */
    onSync(callback) {
        this.onSyncCallbacks.push(callback);
        if (this.isReady) {
            callback();
        }
    }

    /**
     * Register error callback
     */
    onError(callback) {
        this.onErrorCallbacks.push(callback);
    }

    /**
     * Check storage quota and cleanup if needed
     */
    async checkStorageQuota() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return; // Storage API not available
        }

        try {
            const estimate = await navigator.storage.estimate();
            const usedMB = (estimate.usage || 0) / (1024 * 1024);
            const quotaMB = (estimate.quota || 0) / (1024 * 1024);

            console.log(`[IndexedDB] Storage: ${usedMB.toFixed(2)}MB / ${quotaMB.toFixed(2)}MB`);

            if (usedMB > CLEANUP_THRESHOLD_MB && this.options.autoCleanup) {
                console.log('[IndexedDB] Storage threshold exceeded, running cleanup...');
                await this.cleanupOldData();
            }
        } catch (error) {
            console.warn('[IndexedDB] Storage quota check failed:', error);
        }
    }

    /**
     * Cleanup old data to free up storage
     */
    async cleanupOldData() {
        try {
            const dbList = await indexedDB.databases();
            const ilaiDbs = dbList.filter(db => db.name?.startsWith('ilai-note-'));

            // Sort by last accessed (we'd need to track this separately)
            // For now, just log what we found
            console.log(`[IndexedDB] Found ${ilaiDbs.length} note databases`);

            // In a real implementation, we'd:
            // 1. Track last access time for each note
            // 2. Delete databases that haven't been accessed in X days
            // 3. Prioritize keeping notes that have unsynced changes
        } catch (error) {
            console.warn('[IndexedDB] Cleanup failed:', error);
        }
    }

    /**
     * Force persist current state
     */
    async forcePersist() {
        if (!this.persistence) return false;

        try {
            // y-indexeddb automatically persists on changes
            // This is just to ensure any pending writes are flushed
            await new Promise(resolve => setTimeout(resolve, 100));
            return true;
        } catch (error) {
            console.error('[IndexedDB] Force persist failed:', error);
            return false;
        }
    }

    /**
     * Export data for backup
     */
    async exportData() {
        if (!this.doc) return null;

        return {
            noteId: this.noteId,
            state: Array.from(Y.encodeStateAsUpdate(this.doc)),
            exportedAt: Date.now(),
        };
    }

    /**
     * Import data from backup
     */
    async importData(backupData) {
        if (!this.doc || !backupData?.state) return false;

        try {
            const update = new Uint8Array(backupData.state);
            Y.applyUpdate(this.doc, update);
            return true;
        } catch (error) {
            console.error('[IndexedDB] Import failed:', error);
            return false;
        }
    }

    /**
     * Clear all data for this note
     */
    async clearData() {
        if (this.persistence) {
            this.persistence.destroy();
            this.persistence = null;
        }

        try {
            await new Promise((resolve, reject) => {
                const request = indexedDB.deleteDatabase(this.options.dbName);
                request.onsuccess = resolve;
                request.onerror = () => reject(request.error);
            });
            console.log(`[IndexedDB] Cleared data for note ${this.noteId}`);
            return true;
        } catch (error) {
            console.error('[IndexedDB] Clear failed:', error);
            return false;
        }
    }

    /**
     * Destroy the provider
     */
    destroy() {
        if (this.persistence) {
            this.persistence.destroy();
            this.persistence = null;
        }
        this.isReady = false;
        this.onSyncCallbacks = [];
        this.onErrorCallbacks = [];
    }
}

/**
 * Get storage statistics
 */
export async function getStorageStats() {
    if (!navigator.storage || !navigator.storage.estimate) {
        return null;
    }

    try {
        const estimate = await navigator.storage.estimate();
        const dbList = await indexedDB.databases?.() || [];
        const ilaiDbs = dbList.filter(db => db.name?.startsWith('ilai-'));

        return {
            usedBytes: estimate.usage || 0,
            quotaBytes: estimate.quota || 0,
            usedMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
            quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
            percentUsed: ((estimate.usage || 0) / (estimate.quota || 1) * 100).toFixed(1),
            noteDatabases: ilaiDbs.length,
        };
    } catch (error) {
        console.error('[IndexedDB] Failed to get storage stats:', error);
        return null;
    }
}

/**
 * Clear all ILAI data from IndexedDB
 */
export async function clearAllILAIData() {
    try {
        const dbList = await indexedDB.databases?.() || [];
        const ilaiDbs = dbList.filter(db => db.name?.startsWith('ilai-'));

        for (const db of ilaiDbs) {
            if (db.name) {
                await new Promise((resolve, reject) => {
                    const request = indexedDB.deleteDatabase(db.name);
                    request.onsuccess = resolve;
                    request.onerror = () => reject(request.error);
                });
            }
        }

        console.log(`[IndexedDB] Cleared ${ilaiDbs.length} databases`);
        return true;
    } catch (error) {
        console.error('[IndexedDB] Clear all failed:', error);
        return false;
    }
}

export default EnhancedIndexedDBProvider;
