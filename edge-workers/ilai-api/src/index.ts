/**
 * ILAI Hyper Platform - Edge API
 * 
 * Ultra-fast edge API layer using Cloudflare Workers + Hono
 * Provides <5ms latency globally for auth, notes sync, and AI requests
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';

import { authRoutes } from './auth/routes';
import { notesRoutes } from './notes/routes';
import { aiRoutes } from './ai/routes';
import { classroomRoutes } from './classroom/routes';
import { jwtMiddleware } from './middleware/jwt';
import { rateLimiter } from './middleware/rate-limit';

// Environment type definition
export interface Env {
    // Durable Objects
    NOTES_SYNC: DurableObjectNamespace;
    CLASSROOM_SIGNALING: DurableObjectNamespace;
    USER_SESSION: DurableObjectNamespace;

    // KV Namespaces
    AI_CACHE: KVNamespace;

    // Environment variables
    ORIGIN_API_URL: string;
    JWT_ACCESS_SECRET: string;
    GEMINI_API_KEY: string;
    GROQ_API_KEY?: string;
    ENVIRONMENT: string;
}

// Create Hono app with typed environment
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', timing());
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
    origin: ['https://ilai.co.in', 'https://www.ilai.co.in', 'http://localhost:5173'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
}));

// Rate limiting on all routes
app.use('*', rateLimiter);

// Health check (no auth required)
app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        edge: true,
        region: c.req.raw.cf?.colo || 'unknown',
        timestamp: new Date().toISOString(),
    });
});

// Public routes (no auth)
app.route('/api/auth', authRoutes);

// Protected routes (JWT required) - apply middleware to specific paths only
app.use('/api/notes/*', jwtMiddleware);
app.use('/api/ai/*', jwtMiddleware);
app.use('/api/classroom/*', jwtMiddleware);
app.route('/api/notes', notesRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/classroom', classroomRoutes);

// Fallback to origin for unhandled routes
app.all('*', async (c) => {
    const originUrl = new URL(c.req.url);
    originUrl.hostname = new URL(c.env.ORIGIN_API_URL).hostname;

    const response = await fetch(originUrl.toString(), {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: c.req.method !== 'GET' ? await c.req.raw.text() : undefined,
    });

    return new Response(response.body, {
        status: response.status,
        headers: response.headers,
    });
});

// Export Durable Objects
export { NotesSyncDO } from './durable-objects/notes-sync';
export { ClassroomSignalingDO } from './durable-objects/classroom-signaling';
export { UserSessionDO } from './durable-objects/user-session';

export default app;
