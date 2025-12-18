/**
 * Session Management - Durable Objects
 * 
 * Manages user sessions at the edge for ultra-fast validation
 * Sessions are stored in Durable Objects with automatic expiry
 */

import { Context } from 'hono';

interface SessionData {
    userId: string;
    email: string;
    name?: string;
    role: string;
    createdAt: number;
    expiresAt: number;
}

/**
 * Create a new session in Durable Object
 */
export async function createSession(
    c: Context,
    userId: string,
    sessionData: Omit<SessionData, 'createdAt' | 'expiresAt'>
): Promise<void> {
    const sessionId = c.env.USER_SESSION.idFromName(userId);
    const session = c.env.USER_SESSION.get(sessionId);

    const data: SessionData = {
        ...sessionData,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    await session.fetch(new Request('https://internal/session', {
        method: 'POST',
        body: JSON.stringify(data),
    }));
}

/**
 * Get session from Durable Object
 */
export async function getSession(
    c: Context,
    userId: string
): Promise<SessionData | null> {
    const sessionId = c.env.USER_SESSION.idFromName(userId);
    const session = c.env.USER_SESSION.get(sessionId);

    const response = await session.fetch(new Request('https://internal/session', {
        method: 'GET',
    }));

    if (!response.ok) {
        return null;
    }

    const data = await response.json() as { exists: boolean; session?: SessionData };

    if (!data.exists || !data.session) {
        return null;
    }

    // Check if session is expired
    if (data.session.expiresAt < Date.now()) {
        await deleteSession(c, userId);
        return null;
    }

    return data.session;
}

/**
 * Delete session from Durable Object
 */
export async function deleteSession(
    c: Context,
    userId: string
): Promise<void> {
    const sessionId = c.env.USER_SESSION.idFromName(userId);
    const session = c.env.USER_SESSION.get(sessionId);

    await session.fetch(new Request('https://internal/session', {
        method: 'DELETE',
    }));
}

/**
 * Refresh session expiry time
 */
export async function refreshSession(
    c: Context,
    userId: string
): Promise<void> {
    const sessionId = c.env.USER_SESSION.idFromName(userId);
    const session = c.env.USER_SESSION.get(sessionId);

    await session.fetch(new Request('https://internal/session', {
        method: 'PUT',
        body: JSON.stringify({
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        }),
    }));
}

/**
 * Validate that a session exists and is valid
 */
export async function validateSession(
    c: Context,
    userId: string
): Promise<boolean> {
    const session = await getSession(c, userId);
    return session !== null;
}
