/**
 * Classroom Routes - Edge Layer
 * 
 * Handles WebRTC signaling for P2P video/data between students
 * Uses Durable Objects for classroom-scoped state
 */

import { Hono } from 'hono';

interface Env {
    CLASSROOM_SIGNALING: DurableObjectNamespace;
    ORIGIN_API_URL: string;
}

export const classroomRoutes = new Hono<{ Bindings: Env }>();

/**
 * WebSocket endpoint for classroom signaling
 * Handles WebRTC offer/answer/ICE candidate exchange
 */
classroomRoutes.get('/signal/:classroomId', async (c) => {
    const classroomId = c.req.param('classroomId');
    const userId = c.get('userId');
    const userName = c.req.query('name') || 'Anonymous';

    // Get Durable Object for this classroom
    const id = c.env.CLASSROOM_SIGNALING.idFromName(classroomId);
    const stub = c.env.CLASSROOM_SIGNALING.get(id);

    // Forward WebSocket upgrade with user info
    const url = new URL(c.req.url);
    url.searchParams.set('userId', userId);
    url.searchParams.set('userName', userName);

    return stub.fetch(new Request(url.toString(), c.req.raw));
});

/**
 * Get active participants in a classroom
 */
classroomRoutes.get('/:classroomId/participants', async (c) => {
    const classroomId = c.req.param('classroomId');

    const id = c.env.CLASSROOM_SIGNALING.idFromName(classroomId);
    const stub = c.env.CLASSROOM_SIGNALING.get(id);

    const response = await stub.fetch(new Request('https://internal/participants'));
    return c.json(await response.json());
});

/**
 * List classrooms - proxy to origin
 */
classroomRoutes.get('/', async (c) => {
    const originUrl = `${c.env.ORIGIN_API_URL}/api/classrooms`;

    const response = await fetch(originUrl, {
        headers: {
            'Authorization': c.req.header('Authorization') || '',
        },
    });

    return c.json(await response.json(), response.status as any);
});

/**
 * Get classroom details - proxy to origin
 */
classroomRoutes.get('/:classroomId', async (c) => {
    const classroomId = c.req.param('classroomId');
    const originUrl = `${c.env.ORIGIN_API_URL}/api/classrooms/${classroomId}`;

    const response = await fetch(originUrl, {
        headers: {
            'Authorization': c.req.header('Authorization') || '',
        },
    });

    return c.json(await response.json(), response.status as any);
});

/**
 * Create classroom - proxy to origin
 */
classroomRoutes.post('/', async (c) => {
    const originUrl = `${c.env.ORIGIN_API_URL}/api/classrooms`;

    const response = await fetch(originUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': c.req.header('Authorization') || '',
        },
        body: await c.req.text(),
    });

    return c.json(await response.json(), response.status as any);
});

/**
 * Join classroom
 */
classroomRoutes.post('/:classroomId/join', async (c) => {
    const classroomId = c.req.param('classroomId');
    const userId = c.get('userId');

    // Register with Durable Object
    const id = c.env.CLASSROOM_SIGNALING.idFromName(classroomId);
    const stub = c.env.CLASSROOM_SIGNALING.get(id);

    await stub.fetch(new Request('https://internal/join', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    }));

    // Also notify origin
    const originUrl = `${c.env.ORIGIN_API_URL}/api/classrooms/${classroomId}/join`;
    const response = await fetch(originUrl, {
        method: 'POST',
        headers: {
            'Authorization': c.req.header('Authorization') || '',
        },
    });

    return c.json(await response.json(), response.status as any);
});

/**
 * Leave classroom
 */
classroomRoutes.post('/:classroomId/leave', async (c) => {
    const classroomId = c.req.param('classroomId');
    const userId = c.get('userId');

    // Unregister from Durable Object
    const id = c.env.CLASSROOM_SIGNALING.idFromName(classroomId);
    const stub = c.env.CLASSROOM_SIGNALING.get(id);

    await stub.fetch(new Request('https://internal/leave', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    }));

    // Also notify origin
    const originUrl = `${c.env.ORIGIN_API_URL}/api/classrooms/${classroomId}/leave`;
    const response = await fetch(originUrl, {
        method: 'POST',
        headers: {
            'Authorization': c.req.header('Authorization') || '',
        },
    });

    return c.json(await response.json(), response.status as any);
});
