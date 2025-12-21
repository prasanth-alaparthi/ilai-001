import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Database, Plus, Folder, ChevronDown,
    ChevronRight, Edit2, Trash, Trash2, Sidebar as SidebarIcon
} from 'lucide-react';
import { useStompClient } from '../../hooks/useStompClient';
import { useSidebarStore } from '../../store/sidebarStore';
import { InhalingFolder } from './InhalingFolder';
import SectionTree from './SectionTree';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({
    isOpen,
    isMobile,
    setIsOpen,
    notebooks,
    expandedNotebook,
    sections,
    selectedChapter,
    searchQuery,
    setSearchQuery,
    error,
    toggleNotebook,
    handleSearch,
    handleSeedData,
    setShowCreateNotebook,
    handleRenameNotebook,
    handleDeleteNotebook,
    selectChapter,
    setNotebookForChapter,
    setShowCreateChapter,
    handleRenameChapter,
    handleDeleteChapter,
    fetchNotebooks
}) => {
    const navigate = useNavigate();
    const { stompClient } = useStompClient();
    const { highlightedFolderId, isInhaling, triggerInhale, clearHighlight } = useSidebarStore();

    // WebSocket Subscription for Real-time Updates with Breathing Animation
    useEffect(() => {
        if (!stompClient?.connected) return;

        const subscription = stompClient.subscribe('/user/topic/sidebar', (message) => {
            const payload = JSON.parse(message.body);

            if (payload.type === 'REFRESH_FOLDERS' || payload.action === 'REFRESH_SIDEBAR') {
                // Trigger re-fetch
                if (fetchNotebooks) fetchNotebooks();

                // Trigger inhaling animation on new folder
                if (payload.folderId || payload.highlightFolderId) {
                    const folderId = payload.folderId || payload.highlightFolderId;
                    triggerInhale(folderId);
                }
            }
        });

        return () => subscription?.unsubscribe();
    }, [stompClient, fetchNotebooks, triggerInhale]);

    return (
        <motion.div
            initial={false}
            animate={{
                width: isOpen ? (isMobile ? 280 : 300) : 0,
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : (isMobile ? -280 : -20)
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full glass-sidebar flex-shrink-0 flex flex-col overflow-hidden ${isMobile ? 'fixed left-0 top-0 z-50 shadow-2xl' : 'relative'
                }`}
        >
            <div className="p-5 space-y-5 border-b border-lilac-soft/20">
                {/* Search */}
                <form onSubmit={handleSearch} className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-soft" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className="input-alive w-full pl-10 text-sm"
                    />
                </form>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        className="btn-alive flex-1 text-sm py-2"
                        onClick={() => setShowCreateNotebook(true)}
                    >
                        <Plus className="w-4 h-4 inline mr-1" />
                        New Notebook
                    </button>
                </div>
            </div>

            {/* Notebooks List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {error && (
                    <div className="glass-panel p-3 text-sm text-red-500 rounded-2xl">
                        {error}
                    </div>
                )}

                <AnimatePresence>
                    {notebooks?.map((notebook) => (
                        <InhalingFolder
                            key={notebook.id}
                            isInhaling={highlightedFolderId === notebook.id && isInhaling}
                            onClick={() => {
                                toggleNotebook(notebook.id);
                                if (highlightedFolderId === notebook.id) {
                                    clearHighlight();
                                }
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-1"
                            >
                                {/* Notebook Header */}
                                <div className="flex items-center gap-2 p-2 hover:bg-cream-warm/30 rounded-2xl transition-colors group cursor-pointer">
                                    {expandedNotebook === notebook.id ? (
                                        <ChevronDown className="w-4 h-4 text-slate-soft" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-soft" />
                                    )}
                                    <Folder className="w-4 h-4 text-rose-quartz" />
                                    <span className="flex-1 text-sm font-heading text-charcoal-warm truncate">
                                        {notebook.name}
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRenameNotebook(notebook.id);
                                            }}
                                            className="p-1 hover:bg-lavender-muted/30 rounded-lg"
                                        >
                                            <Edit2 className="w-3 h-3 text-slate-soft" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNotebook(notebook.id);
                                            }}
                                            className="p-1 hover:bg-rose-quartz/30 rounded-lg"
                                        >
                                            <Trash2 className="w-3 h-3 text-slate-soft" />
                                        </button>
                                    </div>
                                </div>

                                {/* Sections/Chapters */}
                                <AnimatePresence>
                                    {expandedNotebook === notebook.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="ml-4 pl-4 border-l border-lilac-soft/30"
                                        >
                                            <SectionTree
                                                notebooks={notebooks}
                                                sections={sections}
                                                selectedChapterId={selectedChapter}
                                                onSelectSection={selectChapter}
                                                expandedNotebookId={expandedNotebook}
                                                onAddSection={() => {
                                                    setNotebookForChapter(notebook.id);
                                                    setShowCreateChapter(true);
                                                }}
                                                onRenameSection={handleRenameChapter}
                                                onDeleteSection={handleDeleteChapter}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </InhalingFolder>
                    ))}
                </AnimatePresence>
            </div>

            {/* Mobile Close Button */}
            {isMobile && isOpen && (
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-pearl-white/90 rounded-full shadow-soft"
                >
                    <SidebarIcon className="w-5 h-5 text-charcoal-warm" />
                </button>
            )}
        </motion.div>
    );
};

export default Sidebar;
