import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, X, RefreshCw, ExternalLink,
    Trash2, Edit3, Link as LinkIcon, Search
} from 'lucide-react';
import { notesService } from '../../services/notesService';

export default function BrokenLinksModal({ isOpen, onClose, onSelectNote }) {
    const [brokenLinks, setBrokenLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBrokenLinks = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await notesService.getBrokenLinks();
            setBrokenLinks(data || []);
        } catch (err) {
            console.error('Failed to fetch broken links:', err);
            setError('Could not load broken links. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchBrokenLinks();
        }
    }, [isOpen]);

    const filteredLinks = brokenLinks.filter(link =>
        link.sourceNoteTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.targetTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold dark:text-white">Broken Links</h2>
                                <p className="text-sm text-gray-500">Unresolved wiki-link references in your notes</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by note or link title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={fetchBrokenLinks}
                            disabled={loading}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 transition-all flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span className="text-sm font-medium">Refresh</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[60vh] overflow-y-auto p-6">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm mb-4">
                                {error}
                            </div>
                        )}

                        {loading && brokenLinks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <RefreshCw className="animate-spin text-blue-500" size={32} />
                                <p className="text-gray-500 animate-pulse">Scanning your knowledge base...</p>
                            </div>
                        ) : filteredLinks.length > 0 ? (
                            <div className="space-y-3">
                                {filteredLinks.map((link, idx) => (
                                    <div
                                        key={idx}
                                        className="group p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-800 transition-all flex items-start justify-between"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <LinkIcon size={14} className="text-gray-400" />
                                                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                                    [[{link.targetTitle}]]
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">found in</span>
                                                <button
                                                    onClick={() => {
                                                        onSelectNote(link.sourceNoteId);
                                                        onClose();
                                                    }}
                                                    className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 underline decoration-dotted"
                                                >
                                                    {link.sourceNoteTitle}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                title="Open Source Note"
                                                onClick={() => {
                                                    onSelectNote(link.sourceNoteId);
                                                    onClose();
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={32} className="text-green-500" />
                                </div>
                                <h3 className="text-lg font-medium dark:text-white">No Broken Links</h3>
                                <p className="text-gray-500 max-w-xs mx-auto mt-1">
                                    Your knowledge graph is healthy! All wiki-links point to valid notes.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            {filteredLinks.length} unresolved reference{filteredLinks.length !== 1 ? 's' : ''} found
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

function CheckCircle({ size, className }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
