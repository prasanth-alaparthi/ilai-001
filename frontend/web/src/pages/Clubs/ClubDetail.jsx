import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { PaperAirplaneIcon, VideoCameraIcon, UserGroupIcon } from '@heroicons/react/24/solid';

const ClubDetail = () => {
    const { id } = useParams();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Mock Club Data
    const club = {
        name: id === '1' ? 'Robotics Club' : 'Club Name',
        description: 'Building the future, one bot at a time.'
    };

    useEffect(() => {
        // Mock initial messages
        setMessages([
            { id: 1, sender: 'Alice', content: 'Hey everyone! When is the next meeting?', time: '10:00 AM' },
            { id: 2, sender: 'Bob', content: 'I think it is on Friday at 4 PM.', time: '10:05 AM' },
        ]);
    }, [id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessage = {
            id: messages.length + 1,
            sender: 'Me',
            content: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, newMessage]);
        setInput('');
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{club.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{club.description}</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <UserGroupIcon className="w-5 h-5 mr-2" />
                        Members
                    </button>
                    <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20">
                        <VideoCameraIcon className="w-5 h-5 mr-2" />
                        Start Video Call
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender === 'Me';
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMe
                                    ? 'bg-purple-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-700'
                                }`}>
                                {!isMe && <div className="text-xs font-bold mb-1 opacity-70">{msg.sender}</div>}
                                <p>{msg.content}</p>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                                    {msg.time}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSend} className="flex gap-4 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-500/30"
                    >
                        <PaperAirplaneIcon className="w-6 h-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClubDetail;
