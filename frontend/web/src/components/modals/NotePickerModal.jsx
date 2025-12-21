import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Notebook as NotebookIcon, FileText, ChevronRight, CheckCircle2, Loader2, Send } from 'lucide-react';
import { notesService } from '../../services/notesService';
import Modal from '../ui/Modal';

/**
 * NotePickerModal Component
 * Allows students to select an existing note to solve a bounty.
 * 
 * @param {boolean} isOpen Modal state
 * @param {function} onClose Close handler
 * @param {function} onConfirm Selection callback
 */
const NotePickerModal = ({ isOpen, onClose, onConfirm }) => {
    const [notebooks, setNotebooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [view, setView] = useState('notebooks'); // 'notebooks' | 'notes'
    const [currentNotebook, setCurrentNotebook] = useState(null);
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        if (isOpen) {
            loadNotebooks();
            setSelectedNote(null);
            setView('notebooks');
        }
    }, [isOpen]);

    const loadNotebooks = async () => {
        setLoading(true);
        try {
            const data = await notesService.listNotebooks();
            setNotebooks(data);
        } catch (err) {
            console.error('Failed to load notebooks', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNotebookSelect = async (nb) => {
        setCurrentNotebook(nb);
        setLoading(true);
        try {
            // Flatten notes from all sections in this notebook
            const sections = await notesService.listSections(nb.id);
            const notesPromises = sections.map(s => notesService.listNotesInSection(s.id));
            const notesResults = await Promise.all(notesPromises);
            const allNotes = notesResults.flat();
            setNotes(allNotes);
            setView('notes');
        } catch (err) {
            console.error('Failed to load notes', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedNote) return;
        setIsSyncing(true);

        // Simulate "The Alive Factor" syncing animation
        setTimeout(async () => {
            try {
                await onConfirm(selectedNote);
                onClose();
            } finally {
                setIsSyncing(false);
            }
        }, 1500);
    };

    const filteredNotebooks = notebooks.filter(nb =>
        nb.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isSyncing ? "Syncing Solution..." : "Select Your Solution Note"}
            maxWidth="max-w-lg"
        >
            <div className="min-h-[400px] flex flex-col">
                <AnimatePresence mode="wait">
                    {isSyncing ? (
                        <motion.div
                            key="syncing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex-1 flex flex-col items-center justify-center py-12 text-center"
                        >
                            <div className="relative mb-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="w-24 h-24 rounded-full border-t-2 border-b-2 border-accent-blue"
                                />
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 1.2, 1] }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                    className="absolute inset-0 flex items-center justify-center text-accent-blue"
                                >
                                    <Send size={32} />
                                </motion.div>
                            </div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-accent-blue to-accent-glow bg-clip-text text-transparent mb-2">
                                Encrypting & Syncing
                            </h3>
                            <p className="text-secondary text-sm max-w-[250px]">
                                Preparing solution for secure Direct-to-Folder delivery...
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="picker"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col"
                        >
                            {/* Search Bar */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={view === 'notebooks' ? "Search notebooks..." : "Search notes..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-blue/50 transition-all"
                                />
                            </div>

                            {/* Navigation */}
                            {view === 'notes' && (
                                <button
                                    onClick={() => setView('notebooks')}
                                    className="flex items-center gap-1 text-xs text-accent-blue mb-4 hover:underline"
                                >
                                    <ChevronRight className="rotate-180 w-3 h-3" />
                                    Back to Notebooks ({currentNotebook?.title})
                                </button>
                            )}

                            {/* List Area */}
                            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-2 scrollbar-hide">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
                                    </div>
                                ) : view === 'notebooks' ? (
                                    filteredNotebooks.map(nb => (
                                        <button
                                            key={nb.id}
                                            onClick={() => handleNotebookSelect(nb)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent-blue/30 hover:bg-white/10 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-secondary group-hover:text-accent-blue transition-colors">
                                                    <NotebookIcon size={18} />
                                                </div>
                                                <span className="font-medium text-primary text-sm">{nb.title}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-secondary/50 group-hover:text-accent-blue" />
                                        </button>
                                    ))
                                ) : (
                                    filteredNotes.map(note => (
                                        <button
                                            key={note.id}
                                            onClick={() => setSelectedNote(note)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${selectedNote?.id === note.id
                                                    ? 'bg-accent-blue/10 border-accent-blue shadow-[0_0_15px_rgba(74,144,226,0.1)]'
                                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${selectedNote?.id === note.id ? 'bg-accent-blue text-white' : 'bg-slate-100 dark:bg-slate-800 text-secondary'}`}>
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-primary text-sm">{note.title || 'Untitled Note'}</span>
                                                    <span className="text-[10px] text-secondary/60">Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {selectedNote?.id === note.id && (
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <CheckCircle2 size={20} className="text-accent-blue" />
                                                </motion.div>
                                            )}
                                        </button>
                                    ))
                                )}

                                {!loading && (view === 'notebooks' ? filteredNotebooks : filteredNotes).length === 0 && (
                                    <div className="text-center py-12 opacity-50 italic text-sm">
                                        No {view} found
                                    </div>
                                )}
                            </div>

                            {/* Footer Action */}
                            <div className="mt-6 pt-4 border-t border-white/5">
                                <button
                                    onClick={handleConfirm}
                                    disabled={!selectedNote}
                                    className="w-full py-3 bg-accent-blue disabled:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-accent-blue/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Confirm & Share Solution
                                </button>
                                <p className="text-[10px] text-secondary text-center mt-3 uppercase tracking-widest opacity-40">
                                    Direct-to-Folder Sync Enabled
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Modal>
    );
};

export default NotePickerModal;
