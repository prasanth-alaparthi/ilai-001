import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, AlertTriangle, FileText, Clock, Loader2 } from 'lucide-react';
import { notesService } from '../services/notesService';
import { formatDistanceToNow } from 'date-fns';

export default function TrashPage() {
    const [trashedNotes, setTrashedNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmptying, setIsEmptying] = useState(false);
    const [confirmEmpty, setConfirmEmpty] = useState(false);

    useEffect(() => {
        loadTrash();
    }, []);

    const loadTrash = async () => {
        setIsLoading(true);
        try {
            const data = await notesService.getTrash();
            setTrashedNotes(data);
        } catch (error) {
            console.error('Failed to load trash:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (noteId) => {
        try {
            await notesService.restoreFromTrash(noteId);
            setTrashedNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (error) {
            console.error('Failed to restore note:', error);
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirmEmpty) {
            setConfirmEmpty(true);
            setTimeout(() => setConfirmEmpty(false), 3000);
            return;
        }

        setIsEmptying(true);
        try {
            await notesService.emptyTrash();
            setTrashedNotes([]);
        } catch (error) {
            console.error('Failed to empty trash:', error);
        } finally {
            setIsEmptying(false);
            setConfirmEmpty(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-red-500/20 text-red-400">
                            <Trash2 size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Trash</h1>
                            <p className="text-sm text-surface-400">
                                {trashedNotes.length} {trashedNotes.length === 1 ? 'note' : 'notes'} in trash
                            </p>
                        </div>
                    </div>

                    {trashedNotes.length > 0 && (
                        <button
                            onClick={handleEmptyTrash}
                            disabled={isEmptying}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${confirmEmpty
                                    ? 'bg-red-500 text-white'
                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                }`}
                        >
                            {isEmptying ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <AlertTriangle className="w-4 h-4" />
                            )}
                            {confirmEmpty ? 'Click again to confirm' : 'Empty Trash'}
                        </button>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
                        <p className="text-surface-400">Loading trash...</p>
                    </div>
                ) : trashedNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Trash2 className="w-10 h-10 text-surface-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Trash is empty</h3>
                        <p className="text-surface-400 max-w-md">
                            Notes you delete will appear here. You can restore them or permanently delete them.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {trashedNotes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4"
                                >
                                    <div className="p-2 rounded-lg bg-surface-800 text-surface-400">
                                        <FileText size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white truncate">{note.title || 'Untitled'}</h3>
                                        <div className="flex items-center gap-2 text-xs text-surface-500 mt-1">
                                            <Clock size={12} />
                                            <span>
                                                Deleted {formatDistanceToNow(new Date(note.deletedAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRestore(note.id)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <RotateCcw size={16} />
                                        Restore
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Info */}
                <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                        <p>
                            Notes in trash can be restored at any time. Emptying the trash will permanently delete all notes and their associated data, including version history and links.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
