import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    PenTool,
    BookOpen,
    MessageCircle,
    Sparkles,
    Camera,
    Mic,
    X,
    FileText,
    Image as ImageIcon
} from 'lucide-react';

/**
 * Quick Create Page - Central hub for creating content
 * Accessed via the center FAB in bottom navigation
 */
const CreatePage = () => {
    const navigate = useNavigate();

    const createOptions = [
        {
            icon: PenTool,
            label: 'New Note',
            description: 'Write or type your thoughts',
            color: 'from-blue-500 to-cyan-500',
            path: '/notes?new=true'
        },
        {
            icon: BookOpen,
            label: 'Journal Entry',
            description: 'Record your daily reflections',
            color: 'from-purple-500 to-pink-500',
            path: '/journal?new=true'
        },
        {
            icon: Sparkles,
            label: 'AI Chat',
            description: 'Ask anything, get smart answers',
            color: 'from-amber-500 to-orange-500',
            path: '/ai-assistant'
        },
        {
            icon: MessageCircle,
            label: 'New Message',
            description: 'Start a conversation',
            color: 'from-green-500 to-emerald-500',
            path: '/chat?new=true'
        },
        {
            icon: FileText,
            label: 'Flashcards',
            description: 'Create study flashcards',
            color: 'from-rose-500 to-red-500',
            path: '/flashcards?new=true'
        },
        {
            icon: ImageIcon,
            label: 'Upload',
            description: 'Upload images or documents',
            color: 'from-indigo-500 to-violet-500',
            path: '/upload'
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-xl border-b border-border/50">
                <div className="flex items-center justify-between h-14 px-4">
                    <h1 className="text-lg font-medium text-primary">Create</h1>
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-secondary hover:text-primary rounded-full hover:bg-white/5"
                    >
                        <X size={22} />
                    </button>
                </div>
            </header>

            {/* Quick Actions */}
            <div className="p-4 space-y-4">
                {/* Camera & Voice Row */}
                <div className="flex gap-4 mb-6">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-green text-white"
                    >
                        <Camera size={24} />
                        <span className="font-medium">Scan</span>
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                    >
                        <Mic size={24} />
                        <span className="font-medium">Voice</span>
                    </motion.button>
                </div>

                {/* Create Options Grid */}
                <h2 className="text-sm font-medium text-secondary uppercase tracking-wide mb-3">
                    Create New
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {createOptions.map((option, index) => (
                        <motion.button
                            key={option.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(option.path)}
                            className="flex flex-col items-start p-4 rounded-2xl bg-surface border border-border hover:border-accent-glow/30 transition-colors text-left"
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-3`}>
                                <option.icon size={20} className="text-white" />
                            </div>
                            <h3 className="text-sm font-medium text-primary">{option.label}</h3>
                            <p className="text-xs text-secondary mt-1 line-clamp-2">{option.description}</p>
                        </motion.button>
                    ))}
                </div>

                {/* Recent Section */}
                <div className="mt-8">
                    <h2 className="text-sm font-medium text-secondary uppercase tracking-wide mb-3">
                        Recent
                    </h2>
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border"
                            >
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                    <PenTool size={18} className="text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-primary truncate">Draft Note {i}</p>
                                    <p className="text-xs text-secondary">Edited just now</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePage;
