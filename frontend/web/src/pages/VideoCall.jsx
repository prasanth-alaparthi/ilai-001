import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    MicrophoneIcon,
    VideoCameraIcon,
    PhoneXMarkIcon,
    ChatBubbleLeftRightIcon,
    UserIcon
} from '@heroicons/react/24/solid';

const VideoCall = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const roomName = searchParams.get('room') || 'Meeting Room';
    const localVideoRef = useRef(null);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);

    useEffect(() => {
        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing media devices:", err);
            }
        };

        if (cameraOn) {
            startVideo();
        } else {
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        }

        return () => {
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraOn]);

    const toggleMic = () => setMicOn(!micOn);
    const toggleCamera = () => setCameraOn(!cameraOn);
    const endCall = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        navigate(-1);
    };

    return (
        <div className="h-screen bg-gray-900 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        M
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-lg">{roomName}</h1>
                        <p className="text-gray-300 text-xs flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            00:42
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs backdrop-blur-md border border-white/10">
                        Encrypted
                    </span>
                </div>
            </div>

            {/* Main Video Grid */}
            <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto w-full items-center">
                {/* Remote Participant (Placeholder) */}
                <div className="relative aspect-video bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 flex items-center justify-center group">
                    <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-purple-600 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-purple-600/30">
                            T
                        </div>
                        <h3 className="text-white font-semibold text-xl">Teacher</h3>
                        <p className="text-gray-400 text-sm">Waiting for them to join...</p>
                    </div>
                    <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-md">
                            Teacher
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
                    <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs backdrop-blur-md">
                            You {micOn ? '' : '(Muted)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="p-8 flex justify-center items-center gap-6 bg-gradient-to-t from-black/80 to-transparent">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMic}
                    className={`p-4 rounded-full ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors shadow-lg`}
                >
                    <MicrophoneIcon className="w-6 h-6" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleCamera}
                    className={`p-4 rounded-full ${cameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors shadow-lg`}
                >
                    <VideoCameraIcon className="w-6 h-6" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={endCall}
                    className="p-6 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 mx-4"
                >
                    <PhoneXMarkIcon className="w-8 h-8" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors shadow-lg"
                >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </motion.button>
            </div>
        </div>
    );
};

export default VideoCall;
