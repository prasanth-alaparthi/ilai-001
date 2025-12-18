/**
 * JWT Middleware for Edge Authentication
 * 
 * Validates JWT tokens at the edge for <1ms auth overhead
 * Uses jose library for edge-compatible JWT operations
 */

import { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';

export interface JWTPayload {
    sub: string;      // User ID
    email: string;
    name?: string;
    role: string;
    iat: number;
    exp: number;
}

declare module 'hono' {
    interface ContextVariableMap {
        user: JWTPayload;
        userId: string;
    }
}

export const jwtMiddleware = createMiddleware(async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7);

    try {
        // Get secret from environment
        const secret = new TextEncoder().encode(c.env.JWT_ACCESS_SECRET);

        // Verify token using jose (edge-compatible)
        const { payload } = await jose.jwtVerify(token, secret, {
            algorithms: ['HS256', 'HS384', 'HS512'],
        });

        // Set user info in context
        c.set('user', payload as unknown as JWTPayload);
        c.set('userId', payload.sub as string);

        await next();
    } catch (error) {
        if (error instanceof jose.errors.JWTExpired) {
            return c.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, 401);
        }
        if (error instanceof jose.errors.JWTInvalid) {
            return c.json({ error: 'Invalid token', code: 'TOKEN_INVALID' }, 401);
        }
        console.error('JWT verification error:', error);
        return c.json({ error: 'Authentication failed' }, 401);
    }
});

/**
 * Optional auth middleware - doesn't fail if no token present
 */
export const optionalJwtMiddleware = createMiddleware(async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
            const secret = new TextEncoder().encode(c.env.JWT_ACCESS_SECRET);
            const { payload } = await jose.jwtVerify(token, secret);
            c.set('user', payload as unknown as JWTPayload);
            c.set('userId', payload.sub as string);
        } catch {
            // Silently ignore auth errors for optional auth
        }
    }

    await next();
});
