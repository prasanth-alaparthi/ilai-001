import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiShare2 } from 'react-icons/fi';

export default function ShareNoteModal({ isOpen, onClose, onShare, noteTitle }) {
    const [username, setUsername] = useState('');
    const [permissionLevel, setPermissionLevel] = useState('VIEW'); // VIEW or EDIT

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) {
            onShare(username, permissionLevel);
            setUsername('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-surface-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-800">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                            <FiShare2 /> Share "{noteTitle}"
                        </h3>
                        <button onClick={onClose} className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Username to share with
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Permission Level
                            </label>
                            <select
                                value={permissionLevel}
                                onChange={(e) => setPermissionLevel(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="VIEW">View Only</option>
                                <option value="EDIT">Can Edit</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!username.trim()}
                                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Share Note
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
