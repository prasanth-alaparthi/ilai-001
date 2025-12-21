import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Database, Plus, Folder, ChevronDown,
    ChevronRight, Edit2, Trash, Trash2, Sidebar as SidebarIcon
} from 'lucide-react';
import { useStompClient } from '../../hooks/useStompClient';
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
    fetchNotebooks // Renamed from loadNotebooks for user spec
}) => {
    const navigate = useNavigate();
    const { stompClient } = useStompClient();
    const [newlyAddedFolderId, setNewlyAddedFolderId] = useState(null);

    // WebSocket Subscription for Real-time Updates
    useEffect(() => {
        if (!stompClient) return;

        const subscription = stompClient.subscribe('/user/topic/sidebar', (message) => {
            const payload = JSON.parse(message.body);
            console.log('Real-time Sidebar Message:', payload);

            if (payload.type === 'REFRESH_FOLDERS') {
                // 1. Trigger Re-fetch
                if (fetchNotebooks) fetchNotebooks();

                // 2. Visual Feedback
                if (payload.folderId) {
                    setNewlyAddedFolderId(payload.folderId);
                    // Clear highlight after 10 seconds
                    setTimeout(() => setNewlyAddedFolderId(null), 10000);
                }

                // 3. Optional: Toast (Simulated since no global toast)
                console.log(' Scholar shared a solution! Sidebar refreshed.');
            }
        });

        return () => subscription.unsubscribe();
    }, [stompClient, fetchNotebooks]);

    return (
        <motion.div
            initial={false}
            animate={{
                width: isOpen ? (isMobile ? 280 : 300) : 0,
                opacity: isOpen ? 1 : 0,
                x: isOpen ? 0 : (isMobile ? -280 : -20)
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full border-r border-black/5 dark:border-white/10 bg-white/90 dark:bg-surface/95 backdrop-blur-xl flex-shrink-0 flex flex-col overflow-hidden ${isMobile ? 'fixed left-0 top-0 z-50 shadow-2xl' : 'relative'
                }`}
        >
            <div className="p-5 space-y-5 border-b border-black/5 dark:border-white/10">
                {/* Search */}
                <form onSubmit={handleSearch} className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-glow/50 transition-all placeholder:text-secondary/50"
                    />
                </form>

                {/* Notebooks Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-secondary">Notebooks</h2>
                    <div className="flex items-center gap-1">
                        <button onClick={handleSeedData} className="p-1.5 text-secondary hover:text-primary hover:bg-white/10 rounded-lg transition-colors" title="Seed Data"><Database size={14} /></button>
                        <button onClick={() => setShowCreateNotebook(true)} className="p-1.5 text-secondary hover:text-primary hover:bg-white/10 rounded-lg transition-colors" title="New Notebook"><Plus size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Notebook List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {error && <div className="text-red-400 text-xs px-2 py-1 bg-red-500/10 rounded-lg mb-2">{error}</div>}
                {notebooks.map(notebook => (
                    <div key={notebook.id} className="space-y-1">
                        <button
                            onClick={() => toggleNotebook(notebook.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${expandedNotebook === notebook.id ? 'bg-white/5 text-primary' : 'text-secondary hover:text-primary hover:bg-white/5'
                                }`}
                        >
                            <span className="text-opacity-80 transition-colors" style={{ color: notebook.color }}>
                                <Folder size={16} fill={expandedNotebook === notebook.id ? "currentColor" : "none"} />
                            </span>
                            <span className="flex-1 text-left truncate font-medium">{notebook.title}</span>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleRenameNotebook(e, notebook)} className="p-1 text-secondary hover:text-primary"><Edit2 size={12} /></button>
                                <button onClick={(e) => handleDeleteNotebook(e, notebook)} className="p-1 text-secondary hover:text-red-400"><Trash size={12} /></button>
                            </div>
                            {expandedNotebook === notebook.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        <AnimatePresence>
                            {expandedNotebook === notebook.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden ml-4 border-l border-white/10 pl-2"
                                >
                                    <SectionTree
                                        sections={sections[notebook.id] || []}
                                        selectedId={selectedChapter?.id}
                                        onSelect={selectChapter}
                                        highlightedId={newlyAddedFolderId}
                                        onCreateSection={() => { setNotebookForChapter(notebook); setShowCreateChapter(true); }}
                                        onCreateSubSection={(parentId) => {
                                            const title = prompt("Enter sub-section name:");
                                            if (!title) return;
                                            // Call parent handler (needs to be exposed or logic moved)
                                            // For now we'll assume it's passed or handled via onCreateSubSection prop if it existed
                                        }}
                                        onRenameSection={handleRenameChapter}
                                        onDeleteSection={handleDeleteChapter}
                                        emptyMessage="No chapters yet"
                                    />
                                    <button onClick={() => { setNotebookForChapter(notebook); setShowCreateChapter(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-secondary/50 hover:text-primary transition-colors mt-1">
                                        <Plus size={12} /> Add Section
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Trash Link */}
            <div className="mt-4 pt-4 border-t border-white/5">
                <button
                    onClick={() => navigate('/notes/trash')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                    <span>Trash</span>
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;
