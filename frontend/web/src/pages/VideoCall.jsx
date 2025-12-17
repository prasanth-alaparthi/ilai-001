import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MicrophoneIcon,
    VideoCameraIcon,
    PhoneXMarkIcon,
    ChatBubbleLeftRightIcon,
    UserIcon,
    ComputerDesktopIcon,
    UsersIcon
} from '@heroicons/react/24/solid';

// WebRTC Configuration
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

const VideoCall = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const roomId = searchParams.get('room') || 'default-room';
    const roomName = searchParams.get('name') || 'Meeting Room';

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const localStream = useRef(null);
    const wsRef = useRef(null);

    // State
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [remoteUser, setRemoteUser] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [callDuration, setCallDuration] = useState(0);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [screenSharing, setScreenSharing] = useState(false);
    const [error, setError] = useState(null);

    // Timer for call duration
    useEffect(() => {
        if (isConnected) {
            const timer = setInterval(() => {
                setCallDuration(d => d + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isConnected]);

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Initialize media and WebRTC
    useEffect(() => {
        initializeCall();
        return () => cleanup();
    }, []);

    const initializeCall = async () => {
        try {
            // Get local media stream
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' },
                audio: { echoCancellation: true, noiseSuppression: true }
            });

            localStream.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Initialize WebRTC peer connection
            createPeerConnection();

            // Connect to signaling server (WebSocket)
            connectSignaling();

            setIsConnecting(false);
        } catch (err) {
            console.error('Failed to initialize call:', err);
            setError('Failed to access camera/microphone. Please check permissions.');
            setIsConnecting(false);
        }
    };

    const createPeerConnection = () => {
        peerConnection.current = new RTCPeerConnection(RTC_CONFIG);

        // Add local tracks to peer connection
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => {
                peerConnection.current.addTrack(track, localStream.current);
            });
        }

        // Handle incoming remote stream
        peerConnection.current.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setIsConnected(true);
                setRemoteUser({ name: 'Remote User', connected: true });
            }
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    roomId
                }));
            }
        };

        // Handle connection state changes
        peerConnection.current.onconnectionstatechange = () => {
            console.log('Connection state:', peerConnection.current.connectionState);
            if (peerConnection.current.connectionState === 'connected') {
                setIsConnected(true);
            } else if (peerConnection.current.connectionState === 'disconnected') {
                setIsConnected(false);
                setRemoteUser(null);
            }
        };

        // Handle ICE connection state
        peerConnection.current.oniceconnectionstatechange = () => {
            console.log('ICE state:', peerConnection.current.iceConnectionState);
        };
    };

    const connectSignaling = () => {
        // Try to connect to signaling server
        // For demo, we'll simulate connection without actual WebSocket
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8086/ws/video';

        try {
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('Signaling connected');
                // Join the room
                wsRef.current.send(JSON.stringify({
                    type: 'join',
                    roomId,
                    userName: 'User'
                }));
            };

            wsRef.current.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                await handleSignalingMessage(data);
            };

            wsRef.current.onerror = (err) => {
                console.log('WebSocket error - running in demo mode');
                // Demo mode without signaling server
                setTimeout(() => {
                    setIsConnecting(false);
                }, 1000);
            };

            wsRef.current.onclose = () => {
                console.log('Signaling disconnected');
            };
        } catch (err) {
            console.log('Running in demo mode without signaling server');
            setIsConnecting(false);
        }
    };

    const handleSignalingMessage = async (data) => {
        switch (data.type) {
            case 'user-joined':
                setParticipants(prev => [...prev, data.user]);
                // Create and send offer
                await createAndSendOffer();
                break;

            case 'offer':
                await handleOffer(data.offer);
                break;

            case 'answer':
                await handleAnswer(data.answer);
                break;

            case 'ice-candidate':
                await handleIceCandidate(data.candidate);
                break;

            case 'user-left':
                setParticipants(prev => prev.filter(p => p.id !== data.userId));
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                }
                setRemoteUser(null);
                setIsConnected(false);
                break;

            case 'chat':
                setChatMessages(prev => [...prev, data.message]);
                break;
        }
    };

    const createAndSendOffer = async () => {
        try {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'offer',
                    offer,
                    roomId
                }));
            }
        } catch (err) {
            console.error('Failed to create offer:', err);
        }
    };

    const handleOffer = async (offer) => {
        try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'answer',
                    answer,
                    roomId
                }));
            }
        } catch (err) {
            console.error('Failed to handle offer:', err);
        }
    };

    const handleAnswer = async (answer) => {
        try {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
            console.error('Failed to handle answer:', err);
        }
    };

    const handleIceCandidate = async (candidate) => {
        try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error('Failed to add ICE candidate:', err);
        }
    };

    const cleanup = () => {
        // Stop all tracks
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (peerConnection.current) {
            peerConnection.current.close();
        }

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
        }
    };

    const toggleMic = () => {
        if (localStream.current) {
            const audioTrack = localStream.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicOn(audioTrack.enabled);
            }
        }
    };

    const toggleCamera = () => {
        if (localStream.current) {
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCameraOn(videoTrack.enabled);
            }
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (!screenSharing) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });

                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');

                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = screenStream;
                }

                videoTrack.onended = () => {
                    stopScreenShare();
                };

                setScreenSharing(true);
            } else {
                stopScreenShare();
            }
        } catch (err) {
            console.error('Screen share failed:', err);
        }
    };

    const stopScreenShare = async () => {
        if (localStream.current) {
            const videoTrack = localStream.current.getVideoTracks()[0];
            const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');

            if (sender && videoTrack) {
                await sender.replaceTrack(videoTrack);
            }

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream.current;
            }
        }
        setScreenSharing(false);
    };

    const sendChatMessage = () => {
        if (!chatInput.trim()) return;

        const message = {
            id: Date.now(),
            text: chatInput,
            sender: 'You',
            timestamp: new Date().toLocaleTimeString()
        };

        setChatMessages(prev => [...prev, message]);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'chat',
                message,
                roomId
            }));
        }

        setChatInput('');
    };

    const endCall = () => {
        cleanup();
        navigate(-1);
    };

    // Error state
    if (error) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8 bg-gray-800 rounded-2xl max-w-md">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PhoneXMarkIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Call Error</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {roomName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">{roomName}</h1>
                        <p className="text-gray-300 text-xs flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                            {isConnected ? formatTime(callDuration) : 'Connecting...'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs backdrop-blur-md border border-white/10 flex items-center gap-1">
                        <UsersIcon className="w-3 h-3" />
                        {participants.length + 1}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs backdrop-blur-md border border-green-500/20">
                        🔒 Encrypted
                    </span>
                </div>
            </div>

            {/* Main Video Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full items-center">
                {/* Remote Participant */}
                <div className="relative aspect-video bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 flex items-center justify-center group">
                    {isConnected && remoteUser ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-purple-600 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-purple-600/30">
                                {isConnecting ? (
                                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'T'
                                )}
                            </div>
                            <h3 className="text-white font-semibold text-xl">
                                {isConnecting ? 'Connecting...' : 'Waiting for participant'}
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {isConnecting ? 'Setting up connection' : 'Share the room link to invite'}
                            </p>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-md">
                            {remoteUser?.name || 'Remote'}
                        </span>
                    </div>
                </div>

                {/* Local Video */}
                <div className="relative aspect-video bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 group">
                    {cameraOn ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                                <UserIcon className="w-12 h-12 text-gray-400" />
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-md">
                            You {!micOn && '(Muted)'}
                        </span>
                        {screenSharing && (
                            <span className="px-3 py-1 rounded-full bg-blue-500/50 text-white text-xs backdrop-blur-md">
                                📺 Screen
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Panel */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="absolute right-0 top-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-20"
                    >
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-white font-semibold">Chat</h3>
                            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>{msg.sender}</span>
                                        <span>{msg.timestamp}</span>
                                    </div>
                                    <p className="text-white text-sm">{msg.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={sendChatMessage}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <div className="p-8 flex justify-center items-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMic}
                    className={`p-4 rounded-full ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors shadow-lg`}
                    title={micOn ? 'Mute' : 'Unmute'}
                >
                    <MicrophoneIcon className="w-6 h-6" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleCamera}
                    className={`p-4 rounded-full ${cameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors shadow-lg`}
                    title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                >
                    <VideoCameraIcon className="w-6 h-6" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleScreenShare}
                    className={`p-4 rounded-full ${screenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors shadow-lg`}
                    title="Share screen"
                >
                    <ComputerDesktopIcon className="w-6 h-6" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={endCall}
                    className="p-6 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 mx-2"
                    title="End call"
                >
                    <PhoneXMarkIcon className="w-8 h-8" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowChat(!showChat)}
                    className={`p-4 rounded-full ${showChat ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors shadow-lg`}
                    title="Chat"
                >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </motion.button>
            </div>
        </div>
    );
};

export default VideoCall;
