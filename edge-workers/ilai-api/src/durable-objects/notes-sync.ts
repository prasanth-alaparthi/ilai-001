/**
 * Notes Sync Durable Object
 * 
 * Manages real-time CRDT synchronization for a single note
 * Each note has its own Durable Object instance
 * 
 * Features:
 * - WebSocket connections for real-time sync
 * - CRDT state management
 * - Periodic persistence to origin database
 */

interface Session {
    webSocket: WebSocket;
    userId: string;
    userName?: string;
}

interface NoteState {
    noteId: string;
    content: any;
    version: number;
    lastModified: number;
    collaborators: string[];
}

export class NotesSyncDO implements DurableObject {
    private state: DurableObjectState;
    private sessions: Map<WebSocket, Session> = new Map();
    private noteState: NoteState | null = null;
    private syncTimer: number | null = null;

    constructor(state: DurableObjectState) {
        this.state = state;

        // Load state from storage
        this.state.blockConcurrencyWhile(async () => {
            this.noteState = await this.state.storage.get('noteState') || null;
        });
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        // Handle WebSocket upgrade
        if (request.headers.get('Upgrade') === 'websocket') {
            return this.handleWebSocket(request, url);
        }

        // Handle internal API calls
        switch (url.pathname) {
            case '/state':
                return this.getState(url);
            case '/init':
                return this.initNote(request);
            case '/update':
                return this.applyUpdate(request);
            case '/cleanup':
                return this.cleanup();
            default:
                return new Response('Not found', { status: 404 });
        }
    }

    private async handleWebSocket(request: Request, url: URL): Promise<Response> {
        const userId = url.searchParams.get('userId') || 'anonymous';
        const userName = url.searchParams.get('userName');

        // Create WebSocket pair
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        // Accept the WebSocket
        this.state.acceptWebSocket(server);

        // Store session info
        this.sessions.set(server, { webSocket: server, userId, userName });

        // Send current state to new client
        if (this.noteState) {
            server.send(JSON.stringify({
                type: 'sync',
                state: this.noteState.content,
                version: this.noteState.version,
            }));
        }

        // Broadcast new collaborator
        this.broadcast({
            type: 'user-joined',
            userId,
            userName,
            collaborators: Array.from(this.sessions.values()).map(s => ({
                userId: s.userId,
                userName: s.userName,
            })),
        }, server);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string): Promise<void> {
        const session = this.sessions.get(ws);
        if (!session) return;

        try {
            const data = JSON.parse(message as string);

            switch (data.type) {
                case 'update':
                    // Apply CRDT update
                    await this.applyCRDTUpdate(data.update, session.userId);

                    // Broadcast to other clients
                    this.broadcast({
                        type: 'update',
                        update: data.update,
                        from: session.userId,
                        version: this.noteState?.version,
                    }, ws);
                    break;

                case 'cursor':
                    // Broadcast cursor position to others
                    this.broadcast({
                        type: 'cursor',
                        userId: session.userId,
                        userName: session.userName,
                        position: data.position,
                    }, ws);
                    break;

                case 'awareness':
                    // Broadcast awareness state
                    this.broadcast({
                        type: 'awareness',
                        userId: session.userId,
                        state: data.state,
                    }, ws);
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    }

    async webSocketClose(ws: WebSocket): Promise<void> {
        const session = this.sessions.get(ws);
        if (session) {
            // Broadcast user left
            this.broadcast({
                type: 'user-left',
                userId: session.userId,
                collaborators: Array.from(this.sessions.values())
                    .filter(s => s.webSocket !== ws)
                    .map(s => ({ userId: s.userId, userName: s.userName })),
            });

            this.sessions.delete(ws);
        }

        // If no more sessions, persist state and schedule cleanup
        if (this.sessions.size === 0 && this.noteState) {
            await this.persistToOrigin();
        }
    }

    async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
        console.error('WebSocket error:', error);
        this.sessions.delete(ws);
    }

    private broadcast(message: any, exclude?: WebSocket): void {
        const data = JSON.stringify(message);
        for (const [ws] of this.sessions) {
            if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        }
    }

    private async getState(url: URL): Promise<Response> {
        const userId = url.searchParams.get('userId');

        if (!this.noteState) {
            return Response.json({ hasState: false });
        }

        return Response.json({
            hasState: true,
            state: this.noteState,
        });
    }

    private async initNote(request: Request): Promise<Response> {
        const { noteId, userId, content } = await request.json();

        this.noteState = {
            noteId,
            content,
            version: 1,
            lastModified: Date.now(),
            collaborators: [userId],
        };

        await this.state.storage.put('noteState', this.noteState);

        return Response.json({ success: true });
    }

    private async applyUpdate(request: Request): Promise<Response> {
        const { userId, update } = await request.json();

        await this.applyCRDTUpdate(update, userId);

        return Response.json({
            success: true,
            version: this.noteState?.version,
        });
    }

    private async applyCRDTUpdate(update: any, userId: string): Promise<void> {
        if (!this.noteState) {
            this.noteState = {
                noteId: 'unknown',
                content: update,
                version: 1,
                lastModified: Date.now(),
                collaborators: [userId],
            };
        } else {
            // Merge CRDT update (simplified - real impl would use Yjs)
            this.noteState.content = { ...this.noteState.content, ...update };
            this.noteState.version++;
            this.noteState.lastModified = Date.now();

            if (!this.noteState.collaborators.includes(userId)) {
                this.noteState.collaborators.push(userId);
            }
        }

        // Persist to storage
        await this.state.storage.put('noteState', this.noteState);

        // Schedule sync to origin (debounced)
        this.scheduleSyncToOrigin();
    }

    private scheduleSyncToOrigin(): void {
        // Debounce: sync after 5 seconds of inactivity
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }

        this.syncTimer = setTimeout(() => {
            this.persistToOrigin();
        }, 5000) as any;
    }

    private async persistToOrigin(): Promise<void> {
        if (!this.noteState) return;

        // TODO: Call origin API to persist note
        // This would sync the CRDT state to PostgreSQL
        console.log('Persisting note to origin:', this.noteState.noteId);
    }

    private async cleanup(): Promise<Response> {
        // Clear all sessions
        for (const [ws] of this.sessions) {
            ws.close(1000, 'Note deleted');
        }
        this.sessions.clear();

        // Clear storage
        await this.state.storage.deleteAll();
        this.noteState = null;

        return Response.json({ success: true });
    }
}
