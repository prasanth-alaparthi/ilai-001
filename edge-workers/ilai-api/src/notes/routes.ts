/**
 * Notes Routes - Edge Layer
 * 
 * Handles CRDT sync at the edge using Durable Objects
 * Each note gets its own Durable Object for real-time collaboration
 */

import { Hono } from 'hono';

interface Env {
    NOTES_SYNC: DurableObjectNamespace;
    ORIGIN_API_URL: string;
}

export const notesRoutes = new Hono<{ Bindings: Env }>();

/**
 * WebSocket endpoint for real-time note sync
 * Upgrades HTTP to WebSocket and routes to Durable Object
 */
notesRoutes.get('/sync/:noteId', async (c) => {
    const noteId = c.req.param('noteId');
    const userId = c.get('userId');

    // Get or create Durable Object for this note
    const id = c.env.NOTES_SYNC.idFromName(noteId);
    const stub = c.env.NOTES_SYNC.get(id);

    // Forward the WebSocket upgrade request to the Durable Object
    const url = new URL(c.req.url);
    url.searchParams.set('userId', userId);

    return stub.fetch(new Request(url.toString(), c.req.raw));
});

/**
 * Get note content - proxy to origin with edge caching
 */
notesRoutes.get('/:noteId', async (c) => {
    const noteId = c.req.param('noteId');
    const userId = c.get('userId');

    // First check if Durable Object has latest version
    const id = c.env.NOTES_SYNC.idFromName(noteId);
    const stub = c.env.NOTES_SYNC.get(id);

    const doResponse = await stub.fetch(new Request(`https://internal/state?userId=${userId}`));
    const doData = await doResponse.json() as { hasState: boolean; state?: any };

    if (doData.hasState) {
        return c.json(doData.state);
    }

    // Fallback to origin
    const originUrl = `${c.env.ORIGIN_API_URL}/api/notes/${noteId}`;
    const response = await fetch(originUrl, {
        headers: {
            'Authorization': c.req.header('Authorization') || '',
        },
    });

    return c.json(await response.json(), response.status as any);
});

/**
 * List notes - proxy to origin
 */
notesRoutes.get('/', async (c) => {
    const originUrl = `${c.env.ORIGIN_API_URL}/api/notes`;
    const url = new URL(originUrl);

    // Forward query parameters
    const queryParams = new URL(c.req.url).searchParams;
    queryParams.forEach((value, key) => url.searchParams.set(key, value));

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': c.req.header('Authorization') || '',
        },
    });

    return c.json(await response.json(), response.status as any);
});

/**
 * Create note - proxy to origin, then initialize Durable Object
 */
notesRoutes.post('/', async (c) => {
    const originUrl = `${c.env.ORIGIN_API_URL}/api/notes`;

    const response = await fetch(originUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': c.req.header('Authorization') || '',
        },
        body: await c.req.text(),
    });

    const data = await response.json();

    if (response.ok && data.id) {
        // Initialize Durable Object with empty state
        const id = c.env.NOTES_SYNC.idFromName(data.id.toString());
        const stub = c.env.NOTES_SYNC.get(id);

        await stub.fetch(new Request('https://internal/init', {
            method: 'POST',
            body: JSON.stringify({
                noteId: data.id,
                userId: c.get('userId'),
                content: data.content,
            }),
        }));
    }

    return c.json(data, response.status as any);
});

/**
 * Update note via CRDT - applied at edge, synced to origin
 */
notesRoutes.put('/:noteId', async (c) => {
    const noteId = c.req.param('noteId');
    const userId = c.get('userId');

    // Apply update to Durable Object
    const id = c.env.NOTES_SYNC.idFromName(noteId);
    const stub = c.env.NOTES_SYNC.get(id);

    const response = await stub.fetch(new Request('https://internal/update', {
        method: 'POST',
        body: JSON.stringify({
            userId,
            update: await c.req.json(),
        }),
    }));

    return c.json(await response.json(), response.status as any);
});

/**
 * Delete note
 */
notesRoutes.delete('/:noteId', async (c) => {
    const noteId = c.req.param('noteId');

    // Delete from origin
    const originUrl = `${c.env.ORIGIN_API_URL}/api/notes/${noteId}`;
    const response = await fetch(originUrl, {
        method: 'DELETE',
        headers: {
            'Authorization': c.req.header('Authorization') || '',
        },
    });

    if (response.ok) {
        // Cleanup Durable Object
        const id = c.env.NOTES_SYNC.idFromName(noteId);
        const stub = c.env.NOTES_SYNC.get(id);

        await stub.fetch(new Request('https://internal/cleanup', {
            method: 'DELETE',
        }));
    }

    return c.json(await response.json(), response.status as any);
});
