/**
 * ILAI Hyper Platform - Service Worker Registration
 * 
 * Registers the service worker for offline support and
 * handles updates gracefully.
 */

export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('[PWA] Service Workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        console.log('[PWA] Service Worker registered:', registration.scope);

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[PWA] New Service Worker installing...');

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content available, notify user
                    if (window.confirm('New version available! Reload to update?')) {
                        window.location.reload();
                    }
                }
            });
        });

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'SYNC_NOTES') {
                console.log('[PWA]', event.data.message);
                // Trigger CRDT sync
                window.dispatchEvent(new CustomEvent('ilai-sync-notes'));
            }
        });

        return registration;
    } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
        return null;
    }
}

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('[PWA] Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.log('[PWA] Notifications blocked by user');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(registration) {
    if (!registration) return null;

    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
            )
        });

        console.log('[PWA] Push subscription:', subscription);
        return subscription;
    } catch (error) {
        console.error('[PWA] Push subscription failed:', error);
        return null;
    }
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}

/**
 * Get current online status
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Listen for online/offline changes
 */
export function onConnectivityChange(callback) {
    const onlineHandler = () => callback(true);
    const offlineHandler = () => callback(false);

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    // Return cleanup function with saved references
    return () => {
        window.removeEventListener('online', onlineHandler);
        window.removeEventListener('offline', offlineHandler);
    };
}
