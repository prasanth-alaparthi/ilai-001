// ILAI Service Worker - Offline Support
// This file should be placed in the public folder

const CACHE_NAME = 'ilai-cache-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/assets/logo.svg',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
];

// API endpoints that should use network-first strategy
const NETWORK_FIRST_ROUTES = [
    '/api/auth',
    '/api/payments',
    '/api/gamification',
];

// API endpoints that can be cached (stale-while-revalidate)
const CACHE_FIRST_ROUTES = [
    '/api/notes',
    '/api/flashcards',
    '/api/notebooks',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests for caching (but handle sync queue separately)
    if (request.method !== 'GET') {
        // Queue POST/PUT/DELETE for sync when offline
        if (!navigator.onLine && isApiRequest(url)) {
            event.respondWith(queueForSync(request));
            return;
        }
        return;
    }

    // Network-first for auth and payments (always need fresh data)
    if (isNetworkFirstRoute(url.pathname)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Cache-first for notes and flashcards (can work offline)
    if (isCacheFirstRoute(url.pathname)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Default: cache-first for static assets, network-first for others
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});

// Background sync event
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event received:', event.tag);

    if (event.tag === 'sync-queue') {
        event.waitUntil(processSyncQueue());
    }
});

// Push notification event
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};

    const options = {
        body: data.body || 'New update from ILAI',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/badge-72.png',
        vibrate: [100, 50, 100],
        data: data.url || '/',
        actions: [
            { action: 'open', title: 'Open' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'ILAI', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
});

// Helper functions

function isApiRequest(url) {
    return url.pathname.startsWith('/api/');
}

function isNetworkFirstRoute(pathname) {
    return NETWORK_FIRST_ROUTES.some(route => pathname.startsWith(route));
}

function isCacheFirstRoute(pathname) {
    return CACHE_FIRST_ROUTES.some(route => pathname.startsWith(route));
}

function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ico)$/i.test(pathname);
}

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return caches.match(OFFLINE_URL);
    }
}

// Network-first strategy (for API calls that need fresh data)
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || new Response(JSON.stringify({
            offline: true,
            error: 'You are offline'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Stale-while-revalidate (for notes, flashcards)
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cached);

    return cached || fetchPromise;
}

// Queue failed requests for background sync
async function queueForSync(request) {
    const queue = await getQueue();

    queue.push({
        url: request.url,
        method: request.method,
        body: await request.text(),
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: Date.now(),
    });

    await saveQueue(queue);

    // Register for background sync
    if ('sync' in self.registration) {
        await self.registration.sync.register('sync-queue');
    }

    return new Response(JSON.stringify({
        queued: true,
        message: 'Request queued for sync when online'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Process sync queue
async function processSyncQueue() {
    const queue = await getQueue();
    const failed = [];

    for (const item of queue) {
        try {
            const response = await fetch(item.url, {
                method: item.method,
                body: item.body,
                headers: item.headers,
            });

            if (!response.ok) {
                failed.push(item);
            } else {
                console.log('[SW] Synced:', item.url);
            }
        } catch {
            failed.push(item);
        }
    }

    await saveQueue(failed);

    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'SYNC_COMPLETE',
            synced: queue.length - failed.length,
            failed: failed.length,
        });
    });
}

// IndexedDB helpers for queue persistence
async function getQueue() {
    return new Promise((resolve) => {
        const request = indexedDB.open('ilai-sw', 1);

        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore('sync-queue');
        };

        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('sync-queue', 'readonly');
            const store = tx.objectStore('sync-queue');
            const get = store.get('queue');

            get.onsuccess = () => resolve(get.result || []);
            get.onerror = () => resolve([]);
        };

        request.onerror = () => resolve([]);
    });
}

async function saveQueue(queue) {
    return new Promise((resolve) => {
        const request = indexedDB.open('ilai-sw', 1);

        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction('sync-queue', 'readwrite');
            const store = tx.objectStore('sync-queue');
            store.put(queue, 'queue');

            tx.oncomplete = () => resolve();
        };
    });
}
