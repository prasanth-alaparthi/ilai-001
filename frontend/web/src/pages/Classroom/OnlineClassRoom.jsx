import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MicrophoneIcon, VideoCameraIcon, PhoneXMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const OnlineClassRoom = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [showChat, setShowChat] = useState(false);

    const handleLeave = () => {
        if (window.confirm("Are you sure you want to leave the class?")) {
            navigate('/classroom');
        }
    };

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="h-16 bg-gray-800 flex items-center justify-between px-6 border-b border-gray-700">
                <h1 className="text-white font-bold text-lg">Physics 101 - Live Session</h1>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 text-sm font-medium">REC</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Grid */}
                <div className="flex-1 p-4 flex items-center justify-center bg-black relative">
                    {/* Main Teacher View */}
                    <div className="w-full h-full max-w-5xl bg-gray-800 rounded-xl overflow-hidden relative">
                        <img
                            src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=1000&q=80"
                            alt="Teacher"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm">
                            Dr. Smith (Teacher)
                        </div>
                    </div>

                    {/* Self View (PIP) */}
                    <div className="absolute bottom-8 right-8 w-48 h-32 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg">
                        {cameraOn ? (
                            <img
                                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"
                                alt="Me"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Camera Off</div>
                        )}
                        <div className="absolute bottom-2 left-2 text-white text-xs drop-shadow-md">You</div>
                    </div>
                </div>

                {/* Chat Sidebar */}
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700 text-white font-bold">Class Chat</div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            <div className="text-sm">
                                <span className="font-bold text-blue-400">Alice:</span> <span className="text-gray-300">Can you explain the last formula again?</span>
                            </div>
                            <div className="text-sm">
                                <span className="font-bold text-green-400">Bob:</span> <span className="text-gray-300">Yes, please!</span>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center gap-6">
                <button
                    onClick={() => setMicOn(!micOn)}
                    className={`p-4 rounded-full ${micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                    <MicrophoneIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setCameraOn(!cameraOn)}
                    className={`p-4 rounded-full ${cameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                    <VideoCameraIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={handleLeave}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white px-8 flex items-center font-bold"
                >
                    <PhoneXMarkIcon className="w-6 h-6 mr-2" />
                    Leave
                </button>
                <button
                    onClick={() => setShowChat(!showChat)}
                    className={`p-4 rounded-full ${showChat ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                >
                    <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default OnlineClassRoom;
