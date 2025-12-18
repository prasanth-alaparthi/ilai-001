/**
 * CORS Middleware
 * 
 * Configurable CORS handling for edge API
 * Allows different origins for dev/staging/production
 */

import { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';

// Allowed origins by environment
const ALLOWED_ORIGINS: Record<string, string[]> = {
    development: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
    ],
    staging: [
        'https://staging.ilai.co.in',
        'https://ilai-staging.pages.dev',
    ],
    production: [
        'https://ilai.co.in',
        'https://www.ilai.co.in',
    ],
};

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(env: string): string[] {
    const origins = [
        ...(ALLOWED_ORIGINS.production || []),
        ...(ALLOWED_ORIGINS[env] || []),
    ];

    // In development, allow all localhost origins
    if (env === 'development') {
        return [...origins, ...ALLOWED_ORIGINS.development];
    }

    return origins;
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    return allowedOrigins.some(allowed => {
        if (allowed === origin) return true;
        // Support wildcard subdomains
        if (allowed.startsWith('*.')) {
            const domain = allowed.slice(2);
            return origin.endsWith(domain);
        }
        return false;
    });
}

/**
 * CORS Middleware factory
 */
export const corsMiddleware = createMiddleware(async (c: Context, next: Next) => {
    const origin = c.req.header('Origin');
    const env = c.env.ENVIRONMENT || 'development';
    const allowedOrigins = getAllowedOrigins(env);

    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': origin && isOriginAllowed(origin, allowedOrigins) ? origin : allowedOrigins[0],
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    await next();

    // Add CORS headers to response
    if (origin && isOriginAllowed(origin, allowedOrigins)) {
        c.header('Access-Control-Allow-Origin', origin);
        c.header('Access-Control-Allow-Credentials', 'true');
        c.header('Vary', 'Origin');
    }
});

/**
 * Simple CORS headers for static responses
 */
export function addCorsHeaders(response: Response, origin: string, env: string): Response {
    const allowedOrigins = getAllowedOrigins(env);

    if (isOriginAllowed(origin, allowedOrigins)) {
        const headers = new Headers(response.headers);
        headers.set('Access-Control-Allow-Origin', origin);
        headers.set('Access-Control-Allow-Credentials', 'true');
        headers.set('Vary', 'Origin');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    }

    return response;
}

export default corsMiddleware;
