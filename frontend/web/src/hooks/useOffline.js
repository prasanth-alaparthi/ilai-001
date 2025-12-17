import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for offline detection and sync status
 */
export function useOffline() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingSync, setPendingSync] = useState(0);
    const [swRegistration, setSwRegistration] = useState(null);
    const [swReady, setSwReady] = useState(false);

    // Listen for online/offline events
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Register service worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                    console.log('[App] Service Worker registered');
                    setSwRegistration(registration);
                    setSwReady(true);
                })
                .catch((error) => {
                    console.error('[App] SW registration failed:', error);
                });

            // Listen for messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SYNC_COMPLETE') {
                    console.log('[App] Sync complete:', event.data);
                    checkPendingSync();
                }
            });
        }
    }, []);

    // Check pending sync items
    const checkPendingSync = useCallback(async () => {
        try {
            const request = indexedDB.open('ilai-sw', 1);
            request.onsuccess = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('sync-queue')) {
                    setPendingSync(0);
                    return;
                }
                const tx = db.transaction('sync-queue', 'readonly');
                const store = tx.objectStore('sync-queue');
                const get = store.get('queue');

                get.onsuccess = () => {
                    setPendingSync((get.result || []).length);
                };
            };
        } catch {
            setPendingSync(0);
        }
    }, []);

    // Force sync when back online
    const forceSync = useCallback(async () => {
        if (!swRegistration) return false;

        try {
            await swRegistration.sync.register('sync-queue');
            console.log('[App] Sync triggered');
            return true;
        } catch (error) {
            console.error('[App] Sync failed:', error);
            return false;
        }
    }, [swRegistration]);

    // Subscribe to push notifications
    const subscribeToPush = useCallback(async () => {
        if (!swRegistration) return null;

        try {
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    // Replace with your VAPID public key
                    'YOUR_VAPID_PUBLIC_KEY_HERE'
                ),
            });
            console.log('[App] Push subscription:', subscription);
            return subscription;
        } catch (error) {
            console.error('[App] Push subscription failed:', error);
            return null;
        }
    }, [swRegistration]);

    // Check for updates
    const checkForUpdates = useCallback(async () => {
        if (!swRegistration) return;

        try {
            await swRegistration.update();
            console.log('[App] SW update check complete');
        } catch (error) {
            console.error('[App] SW update check failed:', error);
        }
    }, [swRegistration]);

    // Initial check
    useEffect(() => {
        checkPendingSync();
    }, [checkPendingSync]);

    // Sync when coming back online
    useEffect(() => {
        if (isOnline && pendingSync > 0 && swRegistration) {
            forceSync();
        }
    }, [isOnline, pendingSync, swRegistration, forceSync]);

    return {
        isOnline,
        isOffline: !isOnline,
        pendingSync,
        swReady,
        forceSync,
        subscribeToPush,
        checkForUpdates,
        checkPendingSync,
    };
}

/**
 * Hook for local storage with offline fallback
 */
export function useOfflineStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setStoredValue = useCallback((newValue) => {
        try {
            const valueToStore = typeof newValue === 'function'
                ? newValue(value)
                : newValue;
            setValue(valueToStore);
            localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error('Storage error:', error);
        }
    }, [key, value]);

    return [value, setStoredValue];
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    if (!base64String) return new Uint8Array();
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default useOffline;
