import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    PaperAirplaneIcon,
    SparklesIcon
} from '@heroicons/react/24/outline';
import apiClient from '../services/apiClient';

const AiChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am your personal AI tutor. Ask me anything about your notes!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await apiClient.post('/notes/ask', { question: userMsg.content });
            const aiMsg = {
                role: 'assistant',
                content: res.data.answer,
                sources: res.data.sources
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error while searching your notes." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl z-50 flex items-center justify-center transition-all ${isOpen ? 'hidden' : 'bg-accent-blue text-white hover:bg-accent-blue/80 shadow-accent-blue/30'
                    }`}
            >
                <SparklesIcon className="w-6 h-6" />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 h-[70vh] sm:h-[500px] max-h-[600px] bg-white dark:bg-surface rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 z-50 flex flex-col overflow-hidden backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-accent-blue to-accent-blue/80 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5" />
                                <h3 className="font-bold">Ilai Tutor</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-accent-blue text-white rounded-br-none'
                                            : 'bg-white dark:bg-white/5 text-primary rounded-bl-none shadow-sm border border-black/5 dark:border-white/10'
                                        }`}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-white/20 dark:border-white/10">
                                                <p className="text-xs font-bold text-secondary mb-1">Sources:</p>
                                                <ul className="space-y-1">
                                                    {msg.sources.map(source => (
                                                        <li key={source.id} className="text-xs text-accent-glow truncate">
                                                            • {source.title}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-white/5 p-3 rounded-2xl rounded-bl-none shadow-sm border border-black/5 dark:border-white/10">
                                        <div className="flex gap-1.5">
                                            <span className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white dark:bg-surface border-t border-black/5 dark:border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about your notes..."
                                className="flex-1 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 focus:outline-none focus:border-accent-glow/50 text-sm text-primary placeholder:text-secondary/50 transition-colors"
                                disabled={loading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="p-2.5 bg-accent-blue text-white rounded-xl hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent-blue/20"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AiChat;
