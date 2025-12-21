/**
 * ILAI Hyper Platform - Service Worker
 * 
 * Enables full offline mode with intelligent caching:
 * - Cache-first for static assets
 * - Network-first for API with offline fallback
 * - Background sync for notes when online
 */

const CACHE_VERSION = 'ilai-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
];

// API routes that should work offline
const OFFLINE_API_ROUTES = [
    '/api/notes',
    '/api/notebooks',
    '/api/sections',
    '/api/journal',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key.startsWith('ilai-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
                        .map(key => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests for caching
    if (request.method !== 'GET') {
        return;
    }

    // API requests - Network first with cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstWithCache(request));
        return;
    }

    // Static assets - Cache first
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Dynamic pages - Stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
});

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return caches.match('/offline.html');
    }
}

/**
 * Network-first with cache fallback for API
 */
async function networkFirstWithCache(request) {
    const url = new URL(request.url);

    try {
        const response = await fetch(request);

        // Cache successful GET responses for offline API routes
        if (response.ok && OFFLINE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }

        // Return offline JSON response for API endpoints
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: 'You are currently offline. Data will sync when connection is restored.',
                offline: true
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Stale-while-revalidate for dynamic content
 */
async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request)
        .then(response => {
            if (response.ok) {
                const cache = caches.open(DYNAMIC_CACHE);
                cache.then(c => c.put(request, response.clone()));
            }
            return response;
        })
        .catch(() => cached || caches.match('/offline.html'));

    return cached || fetchPromise;
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico'];
    return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Background sync for notes
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notes') {
        event.waitUntil(syncPendingNotes());
    }
});

/**
 * Sync pending notes from IndexedDB to server
 */
async function syncPendingNotes() {
    // This will be called when the device comes back online
    // The actual sync is handled by the CRDT websocket sync in the app
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_NOTES',
            message: 'Connection restored - syncing notes'
        });
    });
}

// Push notification support
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || 'New notification from ILAI',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            { action: 'explore', title: 'View' },
            { action: 'close', title: 'Close' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('ILAI', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
