/**
 * User Session Durable Object
 * 
 * Manages user sessions at the edge for fast validation
 * Each user has their own Durable Object instance
 */

interface SessionData {
    userId: string;
    email: string;
    createdAt: number;
    lastActive: number;
    metadata?: Record<string, any>;
}

export class UserSessionDO implements DurableObject {
    private state: DurableObjectState;
    private session: SessionData | null = null;

    constructor(state: DurableObjectState) {
        this.state = state;

        // Load session from storage
        this.state.blockConcurrencyWhile(async () => {
            this.session = await this.state.storage.get('session') || null;
        });
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        switch (request.method) {
            case 'GET':
                return this.getSession();
            case 'POST':
                return this.createSession(request);
            case 'PUT':
                return this.updateSession(request);
            case 'DELETE':
                return this.deleteSession();
            default:
                return new Response('Method not allowed', { status: 405 });
        }
    }

    private async getSession(): Promise<Response> {
        if (!this.session) {
            return Response.json({ exists: false }, { status: 404 });
        }

        // Update last active
        this.session.lastActive = Date.now();
        await this.state.storage.put('session', this.session);

        return Response.json({
            exists: true,
            session: this.session,
        });
    }

    private async createSession(request: Request): Promise<Response> {
        const data = await request.json();

        this.session = {
            userId: data.userId,
            email: data.email,
            createdAt: Date.now(),
            lastActive: Date.now(),
            metadata: data.metadata || {},
        };

        await this.state.storage.put('session', this.session);

        // Set alarm to clean up inactive sessions (24 hours)
        await this.state.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000);

        return Response.json({ success: true, session: this.session });
    }

    private async updateSession(request: Request): Promise<Response> {
        if (!this.session) {
            return Response.json({ error: 'No session' }, { status: 404 });
        }

        const data = await request.json();

        this.session = {
            ...this.session,
            ...data,
            lastActive: Date.now(),
        };

        await this.state.storage.put('session', this.session);

        return Response.json({ success: true, session: this.session });
    }

    private async deleteSession(): Promise<Response> {
        this.session = null;
        await this.state.storage.delete('session');

        return Response.json({ success: true });
    }

    // Called by alarm to clean up inactive sessions
    async alarm(): Promise<void> {
        if (!this.session) return;

        const inactiveTime = Date.now() - this.session.lastActive;
        const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours

        if (inactiveTime > maxInactiveTime) {
            // Session expired, clean up
            this.session = null;
            await this.state.storage.delete('session');
        } else {
            // Session still active, set another alarm
            await this.state.storage.setAlarm(Date.now() + maxInactiveTime - inactiveTime);
        }
    }
}
