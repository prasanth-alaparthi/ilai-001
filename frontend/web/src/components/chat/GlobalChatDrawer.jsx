import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiArrowLeft } from 'react-icons/fi';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import UserSearchModal from './UserSearchModal';
import apiClient from '../../services/apiClient';
import { useUser } from '../../state/UserContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function GlobalChatDrawer({ isOpen, onClose }) {
    const { user } = useUser();
    // CRITICAL FIX: Backend uses username string for senderId, not numeric ID
    const userId = user?.username || String(user?.id || '');

    const [view, setView] = useState('LIST'); // LIST | CHAT
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const subscriptionRef = useRef(null);

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            const res = await apiClient.get("/chat/conversations");
            setConversations(res.data || []);
        } catch (e) {
            console.error("Failed to load conversations", e);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen, loadConversations]);

    // Connect to WebSocket
    useEffect(() => {
        if (!userId) return;
        const socket = new SockJS("/ws-chat");
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => console.log("Global Chat STOMP connected"),
            onStompError: (frame) => console.error("Broker error: " + frame.headers["message"]),
        });
        client.activate();
        setStompClient(client);
        return () => client.deactivate();
    }, [userId]);

    // Subscribe to selected conversation
    useEffect(() => {
        if (!stompClient || !stompClient.connected || !selectedConversation) return;

        if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

        const topic = `/topic/conversation/${selectedConversation.id}`;
        subscriptionRef.current = stompClient.subscribe(topic, (message) => {
            const msg = JSON.parse(message.body);
            setMessages((prev) => [msg, ...prev]);
        });

        return () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
        };
    }, [stompClient, selectedConversation, stompClient?.connected]);

    const loadMessages = async (conversation) => {
        try {
            const res = await apiClient.get(`/chat/conversations/${conversation.id}/messages`);
            setMessages(res.data.content || []);
        } catch (e) {
            console.error("Failed to load messages", e);
            setMessages([]);
        }
    };

    const handleSelectConversation = (c) => {
        setSelectedConversation(c);
        loadMessages(c);
        setView('CHAT');
    };

    const handleBack = () => {
        setView('LIST');
        setSelectedConversation(null);
    };

    const handleSend = async (text) => {
        if (!selectedConversation) return;
        try {
            await apiClient.post(`/chat/conversations/${selectedConversation.id}/messages`, {
                content: text,
                type: "TEXT"
            });
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    const handleCreated = (newConv) => {
        setConversations(prev => [newConv, ...prev]);
        handleSelectConversation(newConv);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col border-l border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 bg-slate-50 dark:bg-slate-900">
                            <div className="flex items-center gap-3">
                                {view === 'CHAT' && (
                                    <button onClick={handleBack} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                                        <FiArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                                    </button>
                                )}
                                <h2 className="font-bold text-slate-800 dark:text-white">
                                    {view === 'CHAT' ? (selectedConversation?.name || 'Chat') : 'Messages'}
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <FiX size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden relative">
                            {view === 'LIST' ? (
                                <div className="h-full overflow-y-auto">
                                    {/* We reuse ChatSidebar but might need to tweak it to fit or just use its list logic */}
                                    {/* Since ChatSidebar has its own header/search, we might want to hide our header or let ChatSidebar handle it. 
                        However, ChatSidebar is designed as a sidebar. Let's wrap it.
                        Actually, ChatSidebar has a fixed width of w-80. We should override that.
                    */}
                                    <div className="[&>div]:w-full [&>div]:border-none">
                                        <ChatSidebar
                                            conversations={conversations}
                                            selectedId={selectedConversation?.id}
                                            onSelect={handleSelectConversation}
                                            onNewChat={() => setShowCreateModal(true)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <ChatWindow
                                        conversation={selectedConversation}
                                        messages={[...messages].reverse()}
                                        currentUserId={userId}
                                        onSend={handleSend}
                                    />
                                </div>
                            )}
                        </div>

                        {showCreateModal && (
                            <UserSearchModal
                                onClose={() => setShowCreateModal(false)}
                                onCreated={handleCreated}
                            />
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
