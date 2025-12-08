import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function CreateChapterModal({ onClose, onCreate, notebookTitle }) {
    const [title, setTitle] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            onCreate(title);
            setTitle('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel bg-white/90 dark:bg-surface/90 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-black/5 dark:border-white/10"
            >
                <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10">
                    <h3 className="text-lg font-serif font-bold text-primary">
                        Add Chapter to <span className="text-accent-glow">{notebookTitle}</span>
                    </h3>
                    <button onClick={onClose} className="p-2 text-secondary hover:text-primary hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                            Chapter Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Chapter 1"
                            className="w-full px-4 py-3 rounded-xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-primary placeholder:text-secondary/50 focus:ring-2 focus:ring-accent-glow/50 focus:border-accent-glow outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-secondary font-medium hover:text-primary hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="px-5 py-2.5 rounded-xl bg-accent-glow text-white font-medium hover:bg-accent-glow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent-glow/20"
                        >
                            Add Chapter
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
