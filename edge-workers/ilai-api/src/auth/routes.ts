/**
 * Auth Routes - Edge Layer
 * 
 * Handles JWT validation and session management at the edge
 * Login/Register still proxied to origin for database operations
 */

import { Hono } from 'hono';
import * as jose from 'jose';

interface Env {
    USER_SESSION: DurableObjectNamespace;
    ORIGIN_API_URL: string;
    JWT_ACCESS_SECRET: string;
}

export const authRoutes = new Hono<{ Bindings: Env }>();

/**
 * Proxy login to origin server
 * Origin handles database validation and returns tokens
 */
authRoutes.post('/login', async (c) => {
    const originUrl = `${c.env.ORIGIN_API_URL}/api/auth/login`;

    const response = await fetch(originUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: await c.req.text(),
    });

    const data = await response.json();

    if (response.ok && data.accessToken) {
        // Store session in Durable Object for fast validation
        const sessionId = c.env.USER_SESSION.idFromName(data.user.id.toString());
        const session = c.env.USER_SESSION.get(sessionId);

        await session.fetch(new Request('https://internal/session', {
            method: 'POST',
            body: JSON.stringify({
                userId: data.user.id,
                email: data.user.email,
                createdAt: Date.now(),
            }),
        }));
    }

    return c.json(data, response.status as any);
});

/**
 * Proxy registration to origin server
 */
authRoutes.post('/register', async (c) => {
    const originUrl = `${c.env.ORIGIN_API_URL}/api/auth/register`;

    const response = await fetch(originUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: await c.req.text(),
    });

    return c.json(await response.json(), response.status as any);
});

/**
 * Validate token at the edge (fast path)
 */
authRoutes.get('/validate', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ valid: false, error: 'Missing token' }, 401);
    }

    const token = authHeader.substring(7);

    try {
        const secret = new TextEncoder().encode(c.env.JWT_ACCESS_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);

        return c.json({
            valid: true,
            user: {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                role: payload.role,
            },
            expiresAt: payload.exp,
        });
    } catch (error) {
        if (error instanceof jose.errors.JWTExpired) {
            return c.json({ valid: false, error: 'Token expired' }, 401);
        }
        return c.json({ valid: false, error: 'Invalid token' }, 401);
    }
});

/**
 * Refresh token - proxy to origin
 */
authRoutes.post('/refresh', async (c) => {
    const originUrl = `${c.env.ORIGIN_API_URL}/api/auth/refresh`;

    const response = await fetch(originUrl, {
        method: 'POST',
        headers: c.req.raw.headers,
        body: await c.req.text(),
    });

    return c.json(await response.json(), response.status as any);
});

/**
 * Logout - clear edge session
 */
authRoutes.post('/logout', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const secret = new TextEncoder().encode(c.env.JWT_ACCESS_SECRET);
            const { payload } = await jose.jwtVerify(token, secret);

            // Clear Durable Object session
            const sessionId = c.env.USER_SESSION.idFromName(payload.sub as string);
            const session = c.env.USER_SESSION.get(sessionId);

            await session.fetch(new Request('https://internal/session', {
                method: 'DELETE',
            }));
        } catch {
            // Ignore errors during logout
        }
    }

    // Also proxy to origin for server-side cleanup
    const originUrl = `${c.env.ORIGIN_API_URL}/api/auth/logout`;
    await fetch(originUrl, {
        method: 'POST',
        headers: c.req.raw.headers,
    });

    return c.json({ success: true });
});
