/**
 * Edge Rate Limiter
 * 
 * Simple in-memory rate limiting at the edge
 * Can be upgraded to use Cloudflare's built-in rate limiting
 */

import { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';

// Simple sliding window rate limiter using Map
// In production, use Cloudflare's built-in rate limiting or Durable Objects
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 100;  // requests
const WINDOW_MS = 60000; // 1 minute

export const rateLimiter = createMiddleware(async (c: Context, next: Next) => {
    // Skip rate limiting for health checks
    if (c.req.path === '/health') {
        return next();
    }

    // Get client identifier (prefer user ID if authenticated, fallback to IP)
    const clientId = c.get('userId') || c.req.header('CF-Connecting-IP') || 'unknown';
    const now = Date.now();

    // Get or create rate limit entry
    let entry = requestCounts.get(clientId);

    if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + WINDOW_MS };
        requestCounts.set(clientId, entry);
    }

    entry.count++;

    // Check if rate limited
    if (entry.count > RATE_LIMIT) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

        return c.json(
            {
                error: 'Too many requests',
                code: 'RATE_LIMITED',
                retryAfter,
            },
            429,
            {
                'Retry-After': String(retryAfter),
                'X-RateLimit-Limit': String(RATE_LIMIT),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(entry.resetAt),
            }
        );
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', String(RATE_LIMIT));
    c.header('X-RateLimit-Remaining', String(RATE_LIMIT - entry.count));
    c.header('X-RateLimit-Reset', String(entry.resetAt));

    await next();
});

// Cleanup old entries periodically (called by scheduled worker)
export function cleanupRateLimits() {
    const now = Date.now();
    for (const [key, entry] of requestCounts) {
        if (now > entry.resetAt + WINDOW_MS) {
            requestCounts.delete(key);
        }
    }
}
