/**
 * ILAI Hyper Platform - WebRTC P2P Classroom
 * 
 * Enables peer-to-peer video/audio/data connections for classroom
 * collaboration. Uses Durable Object signaling server at the edge.
 * 
 * Benefits:
 * - Direct P2P reduces server load
 * - Lower latency for video calls
 * - Screen sharing for presentations
 * - Data channels for collaborative whiteboards
 */

// ICE server configuration
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * P2P Classroom Manager
 * Manages WebRTC connections for a classroom session
 */
export class P2PClassroom {
    constructor(classroomId, userId, signalingUrl) {
        this.classroomId = classroomId;
        this.userId = userId;
        this.signalingUrl = signalingUrl;
        this.socket = null;
        this.peers = new Map(); // peerId -> RTCPeerConnection
        this.localStream = null;
        this.dataChannels = new Map(); // peerId -> RTCDataChannel
        this.onPeerJoin = null;
        this.onPeerLeave = null;
        this.onRemoteStream = null;
        this.onDataMessage = null;
    }

    /**
     * Connect to the signaling server
     */
    async connect() {
        return new Promise((resolve, reject) => {
            const url = `${this.signalingUrl}/classroom/${this.classroomId}?userId=${this.userId}`;
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log('[P2P] Connected to signaling server');
                resolve();
            };

            this.socket.onerror = (error) => {
                console.error('[P2P] Signaling connection error:', error);
                reject(error);
            };

            this.socket.onmessage = (event) => {
                this.handleSignalingMessage(JSON.parse(event.data));
            };

            this.socket.onclose = () => {
                console.log('[P2P] Signaling connection closed');
                this.cleanup();
            };
        });
    }

    /**
     * Handle incoming signaling messages
     */
    async handleSignalingMessage(message) {
        const { type, from, payload } = message;

        switch (type) {
            case 'peer-join':
                console.log('[P2P] Peer joined:', from);
                this.onPeerJoin?.(from);
                // Initiate connection to new peer
                await this.createOffer(from);
                break;

            case 'peer-leave':
                console.log('[P2P] Peer left:', from);
                this.closePeerConnection(from);
                this.onPeerLeave?.(from);
                break;

            case 'offer':
                await this.handleOffer(from, payload);
                break;

            case 'answer':
                await this.handleAnswer(from, payload);
                break;

            case 'ice-candidate':
                await this.handleIceCandidate(from, payload);
                break;
        }
    }

    /**
     * Get local media stream (camera/microphone)
     */
    async getLocalStream(options = { video: true, audio: true }) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(options);
            return this.localStream;
        } catch (error) {
            console.error('[P2P] Failed to get local media:', error);
            throw error;
        }
    }

    /**
     * Share screen
     */
    async getScreenStream() {
        try {
            return await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: true
            });
        } catch (error) {
            console.error('[P2P] Failed to get screen share:', error);
            throw error;
        }
    }

    /**
     * Create a peer connection
     */
    createPeerConnection(peerId) {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignaling(peerId, 'ice-candidate', event.candidate);
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`[P2P] Connection state with ${peerId}:`, pc.connectionState);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.closePeerConnection(peerId);
                this.onPeerLeave?.(peerId);
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('[P2P] Received remote track from:', peerId);
            this.onRemoteStream?.(peerId, event.streams[0]);
        };

        // Setup data channel for messaging
        const dataChannel = pc.createDataChannel('classroom-data');
        this.setupDataChannel(peerId, dataChannel);

        pc.ondatachannel = (event) => {
            this.setupDataChannel(peerId, event.channel);
        };

        this.peers.set(peerId, pc);
        return pc;
    }

    /**
     * Setup data channel for peer messaging
     */
    setupDataChannel(peerId, channel) {
        channel.onopen = () => {
            console.log('[P2P] Data channel open with:', peerId);
            this.dataChannels.set(peerId, channel);
        };

        channel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.onDataMessage?.(peerId, data);
            } catch {
                this.onDataMessage?.(peerId, event.data);
            }
        };

        channel.onclose = () => {
            this.dataChannels.delete(peerId);
        };
    }

    /**
     * Create and send an offer to a peer
     */
    async createOffer(peerId) {
        const pc = this.createPeerConnection(peerId);

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.sendSignaling(peerId, 'offer', offer);
        } catch (error) {
            console.error('[P2P] Failed to create offer:', error);
        }
    }

    /**
     * Handle incoming offer
     */
    async handleOffer(peerId, offer) {
        let pc = this.peers.get(peerId);
        if (!pc) {
            pc = this.createPeerConnection(peerId);
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.sendSignaling(peerId, 'answer', answer);
        } catch (error) {
            console.error('[P2P] Failed to handle offer:', error);
        }
    }

    /**
     * Handle incoming answer
     */
    async handleAnswer(peerId, answer) {
        const pc = this.peers.get(peerId);
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error('[P2P] Failed to handle answer:', error);
            }
        }
    }

    /**
     * Handle incoming ICE candidate
     */
    async handleIceCandidate(peerId, candidate) {
        const pc = this.peers.get(peerId);
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('[P2P] Failed to add ICE candidate:', error);
            }
        }
    }

    /**
     * Send signaling message to a peer
     */
    sendSignaling(peerId, type, payload) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type,
                targetId: peerId,
                payload
            }));
        }
    }

    /**
     * Send data message to a specific peer
     */
    sendData(peerId, data) {
        const channel = this.dataChannels.get(peerId);
        if (channel?.readyState === 'open') {
            channel.send(JSON.stringify(data));
        }
    }

    /**
     * Broadcast data to all connected peers
     */
    broadcast(data) {
        const message = JSON.stringify(data);
        this.dataChannels.forEach((channel) => {
            if (channel.readyState === 'open') {
                channel.send(message);
            }
        });
    }

    /**
     * Close connection to a specific peer
     */
    closePeerConnection(peerId) {
        const pc = this.peers.get(peerId);
        if (pc) {
            pc.close();
            this.peers.delete(peerId);
        }
        this.dataChannels.delete(peerId);
    }

    /**
     * Disconnect from classroom
     */
    disconnect() {
        // Close all peer connections
        this.peers.forEach((pc, peerId) => {
            pc.close();
        });
        this.peers.clear();
        this.dataChannels.clear();

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Close signaling connection
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        console.log('[P2P] Disconnected from classroom');
    }

    /**
     * Cleanup on disconnect
     */
    cleanup() {
        this.peers.forEach((pc) => pc.close());
        this.peers.clear();
        this.dataChannels.clear();
    }

    /**
     * Get connected peers count
     */
    getConnectedPeersCount() {
        return this.peers.size;
    }

    /**
     * Get list of connected peer IDs
     */
    getConnectedPeers() {
        return Array.from(this.peers.keys());
    }
}

/**
 * Hook for using P2P Classroom in React components
 */
export function createClassroomSession(classroomId, userId, signalingUrl) {
    const classroom = new P2PClassroom(classroomId, userId, signalingUrl);
    return classroom;
}

export default P2PClassroom;
