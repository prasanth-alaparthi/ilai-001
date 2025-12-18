/**
 * Classroom Signaling Durable Object
 * 
 * Handles WebRTC signaling for P2P connections in a classroom
 * Students connect directly to each other after initial signaling
 * 
 * Flow:
 * 1. Student A joins -> stored in peers map
 * 2. Student B joins -> receives list of existing peers
 * 3. Student B sends offer to Student A via DO
 * 4. Student A responds with answer via DO
 * 5. ICE candidates exchanged via DO
 * 6. Direct P2P connection established (DO no longer needed)
 */

interface Peer {
    webSocket: WebSocket;
    userId: string;
    userName: string;
    joinedAt: number;
}

export class ClassroomSignalingDO implements DurableObject {
    private state: DurableObjectState;
    private peers: Map<string, Peer> = new Map();
    private classroomId: string = '';

    constructor(state: DurableObjectState) {
        this.state = state;
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        // Handle WebSocket upgrade for signaling
        if (request.headers.get('Upgrade') === 'websocket') {
            return this.handleWebSocket(request, url);
        }

        // Handle internal API calls
        switch (url.pathname) {
            case '/participants':
                return this.getParticipants();
            case '/join':
                return this.handleJoin(request);
            case '/leave':
                return this.handleLeave(request);
            default:
                return new Response('Not found', { status: 404 });
        }
    }

    private async handleWebSocket(request: Request, url: URL): Promise<Response> {
        const userId = url.searchParams.get('userId') || 'anonymous';
        const userName = url.searchParams.get('userName') || 'Anonymous';

        // Create WebSocket pair
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        // Accept the WebSocket
        this.state.acceptWebSocket(server);

        // Store peer info
        const peer: Peer = {
            webSocket: server,
            userId,
            userName,
            joinedAt: Date.now(),
        };
        this.peers.set(userId, peer);

        // Send existing peers to new joiner
        const existingPeers = Array.from(this.peers.values())
            .filter(p => p.userId !== userId)
            .map(p => ({ userId: p.userId, userName: p.userName }));

        server.send(JSON.stringify({
            type: 'peers',
            peers: existingPeers,
        }));

        // Notify existing peers of new joiner
        this.broadcast({
            type: 'peer-joined',
            peer: { userId, userName },
        }, userId);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string): Promise<void> {
        try {
            const data = JSON.parse(message as string);
            const fromPeer = this.findPeerBySocket(ws);
            if (!fromPeer) return;

            switch (data.type) {
                case 'offer':
                    // Forward WebRTC offer to target peer
                    this.sendToPeer(data.targetId, {
                        type: 'offer',
                        from: fromPeer.userId,
                        fromName: fromPeer.userName,
                        offer: data.offer,
                    });
                    break;

                case 'answer':
                    // Forward WebRTC answer to target peer
                    this.sendToPeer(data.targetId, {
                        type: 'answer',
                        from: fromPeer.userId,
                        answer: data.answer,
                    });
                    break;

                case 'ice-candidate':
                    // Forward ICE candidate to target peer
                    this.sendToPeer(data.targetId, {
                        type: 'ice-candidate',
                        from: fromPeer.userId,
                        candidate: data.candidate,
                    });
                    break;

                case 'chat':
                    // Broadcast chat message to all peers
                    this.broadcast({
                        type: 'chat',
                        from: fromPeer.userId,
                        fromName: fromPeer.userName,
                        message: data.message,
                        timestamp: Date.now(),
                    });
                    break;

                case 'screen-share-start':
                    this.broadcast({
                        type: 'screen-share-start',
                        from: fromPeer.userId,
                        fromName: fromPeer.userName,
                    }, fromPeer.userId);
                    break;

                case 'screen-share-stop':
                    this.broadcast({
                        type: 'screen-share-stop',
                        from: fromPeer.userId,
                    }, fromPeer.userId);
                    break;
            }
        } catch (error) {
            console.error('Signaling message error:', error);
        }
    }

    async webSocketClose(ws: WebSocket): Promise<void> {
        const peer = this.findPeerBySocket(ws);
        if (peer) {
            this.peers.delete(peer.userId);

            // Notify other peers
            this.broadcast({
                type: 'peer-left',
                userId: peer.userId,
            });
        }
    }

    async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
        console.error('Signaling WebSocket error:', error);
        const peer = this.findPeerBySocket(ws);
        if (peer) {
            this.peers.delete(peer.userId);
        }
    }

    private findPeerBySocket(ws: WebSocket): Peer | undefined {
        for (const peer of this.peers.values()) {
            if (peer.webSocket === ws) return peer;
        }
        return undefined;
    }

    private sendToPeer(userId: string, message: any): void {
        const peer = this.peers.get(userId);
        if (peer && peer.webSocket.readyState === WebSocket.OPEN) {
            peer.webSocket.send(JSON.stringify(message));
        }
    }

    private broadcast(message: any, excludeUserId?: string): void {
        const data = JSON.stringify(message);
        for (const peer of this.peers.values()) {
            if (peer.userId !== excludeUserId && peer.webSocket.readyState === WebSocket.OPEN) {
                peer.webSocket.send(data);
            }
        }
    }

    private async getParticipants(): Promise<Response> {
        const participants = Array.from(this.peers.values()).map(p => ({
            userId: p.userId,
            userName: p.userName,
            joinedAt: p.joinedAt,
        }));

        return Response.json({
            count: participants.length,
            participants,
        });
    }

    private async handleJoin(request: Request): Promise<Response> {
        const { userId } = await request.json();
        return Response.json({ success: true, peersOnline: this.peers.size });
    }

    private async handleLeave(request: Request): Promise<Response> {
        const { userId } = await request.json();
        const peer = this.peers.get(userId);

        if (peer) {
            peer.webSocket.close(1000, 'Left classroom');
            this.peers.delete(userId);

            this.broadcast({
                type: 'peer-left',
                userId,
            });
        }

        return Response.json({ success: true });
    }
}
