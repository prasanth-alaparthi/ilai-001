import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Calendar, Clock,
    ExternalLink, ArrowRight, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import notesService from '../../services/notesService';

export default function NotePreviewTooltip({ targetEl, onClose }) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef(null);

    useEffect(() => {
        if (!targetEl) return;

        const loadPreview = async () => {
            setLoading(true);
            try {
                // The WikiLinkExtension inserts content as Title, so we get the title from the text
                const title = targetEl.textContent.trim();
                const data = await notesService.getNotePreview(title);
                setPreview(data);
            } catch (err) {
                console.error('Hover preview error:', err);
                setError('Preview not available');
            } finally {
                setLoading(false);
            }
        };

        // Calculate position
        const rect = targetEl.getBoundingClientRect();
        setPosition({
            top: rect.bottom + window.scrollY + 8,
            left: rect.left + window.scrollX
        });

        loadPreview();
    }, [targetEl]);

    if (!targetEl) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={tooltipRef}
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                style={{
                    position: 'absolute',
                    top: position.top,
                    left: position.left,
                    zIndex: 1000
                }}
                className="w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 pointer-events-none"
            >
                {loading ? (
                    <div className="flex items-center gap-3 py-2">
                        <Loader2 className="animate-spin text-blue-500" size={16} />
                        <span className="text-sm text-gray-500">Loading preview...</span>
                    </div>
                ) : preview ? (
                    <div className="space-y-3">
                        <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1">
                                {preview.title}
                            </h4>
                            <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <FileText size={12} className="text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 leading-relaxed italic">
                            "{preview.preview}"
                        </p>

                        <div className="pt-2 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                <Clock size={10} />
                                {formatDistanceToNow(new Date(preview.updatedAt))} ago
                            </div>
                            <div className="text-[10px] text-blue-500 font-bold flex items-center gap-1">
                                Click to open <ArrowRight size={10} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-400 italic">
                        {error || 'No preview available'}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
