import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, CloudOff, Check, AlertCircle } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

/**
 * Offline Status Banner - Shows when user is offline
 */
export function OfflineBanner() {
    const { isOffline, pendingSync, forceSync } = useOffline();

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <WifiOff className="w-5 h-5" />
                            <span className="font-medium">You're offline</span>
                            {pendingSync > 0 && (
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                                    {pendingSync} changes pending
                                </span>
                            )}
                        </div>
                        <button
                            onClick={forceSync}
                            className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Connection Status Indicator - Small indicator in header/sidebar
 */
export function ConnectionIndicator({ showLabel = false }) {
    const { isOnline, pendingSync } = useOffline();

    return (
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
            {showLabel && (
                <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-amber-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            )}
            {!isOnline && pendingSync > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {pendingSync}
                </span>
            )}
        </div>
    );
}

/**
 * Sync Status Toast - Shows after successful/failed sync
 */
export function SyncStatusToast({ synced, failed, onDismiss }) {
    if (synced === 0 && failed === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-lg ${failed > 0
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-white'
                }`}
        >
            <div className="flex items-center gap-3">
                {failed > 0 ? (
                    <AlertCircle className="w-5 h-5" />
                ) : (
                    <Check className="w-5 h-5" />
                )}
                <div>
                    <p className="font-medium">
                        {failed > 0 ? 'Sync partially failed' : 'Sync complete!'}
                    </p>
                    <p className="text-sm opacity-90">
                        {synced} synced{failed > 0 ? `, ${failed} failed` : ''}
                    </p>
                </div>
                <button onClick={onDismiss} className="ml-4 opacity-70 hover:opacity-100">
                    ×
                </button>
            </div>
        </motion.div>
    );
}

/**
 * Offline Mode Card - For settings/info pages
 */
export function OfflineModeCard() {
    const { isOnline, swReady, pendingSync, checkForUpdates } = useOffline();

    return (
        <div className="p-6 bg-surface-100 dark:bg-surface-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {isOnline ? (
                        <Wifi className="w-6 h-6 text-green-500" />
                    ) : (
                        <WifiOff className="w-6 h-6 text-amber-500" />
                    )}
                    <div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
                            Offline Mode
                        </h3>
                        <p className="text-sm text-surface-500">
                            {isOnline ? 'Connected' : 'Working offline'}
                        </p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${swReady
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-surface-200 text-surface-600'
                    }`}>
                    {swReady ? 'Enabled' : 'Not available'}
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-surface-600 dark:text-surface-400">Service Worker</span>
                    <span className={swReady ? 'text-green-600' : 'text-surface-500'}>
                        {swReady ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-surface-600 dark:text-surface-400">Pending Changes</span>
                    <span className={pendingSync > 0 ? 'text-amber-600' : 'text-surface-500'}>
                        {pendingSync}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-surface-600 dark:text-surface-400">Connection</span>
                    <span className={isOnline ? 'text-green-600' : 'text-amber-600'}>
                        {isOnline ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>

            <button
                onClick={checkForUpdates}
                className="w-full py-2 px-4 bg-surface-200 dark:bg-surface-700 rounded-lg text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors flex items-center justify-center gap-2"
            >
                <RefreshCw className="w-4 h-4" />
                Check for Updates
            </button>
        </div>
    );
}

/**
 * Offline Indicator for individual items (notes, flashcards)
 */
export function OfflineItemBadge({ isCached = false, isPending = false }) {
    if (!isCached && !isPending) return null;

    return (
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isPending
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
            }`}>
            {isPending ? (
                <>
                    <CloudOff className="w-3 h-3" />
                    Pending
                </>
            ) : (
                <>
                    <Check className="w-3 h-3" />
                    Saved
                </>
            )}
        </div>
    );
}

export default { OfflineBanner, ConnectionIndicator, SyncStatusToast, OfflineModeCard, OfflineItemBadge };
