import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, BookOpen, Copy, Sparkles, X, ExternalLink,
    Image, Video, FileText, Check, Loader2, FolderPlus,
    Globe, ChevronRight, RefreshCw
} from 'lucide-react';
import apiClient from '../services/apiClient';

/**
 * TextSelectionPopup - Global component for text selection automation
 * Appears when user selects text anywhere in the app
 * Features: Web Search, Save to Notes, Copy
 * Enhanced with better contrast and elaborate search panel
 */
export default function TextSelectionPopup() {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [showNotebookBrowser, setShowNotebookBrowser] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const [copied, setCopied] = useState(false);
    const popupRef = useRef(null);

    // Listen for text selection
    useEffect(() => {
        const handleMouseUp = (e) => {
            // Ignore if clicking on popup itself
            if (popupRef.current?.contains(e.target)) return;
            // Ignore if inside input or textarea
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

            const selection = window.getSelection();
            const text = selection?.toString().trim();

            if (text && text.length > 2 && text.length < 5000) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                setSelectedText(text);
                setPosition({
                    x: Math.min(rect.left + rect.width / 2, window.innerWidth - 150),
                    y: Math.max(rect.top - 60, 10)
                });
                setVisible(true);
                setCopied(false);
            } else {
                setTimeout(() => {
                    if (!popupRef.current?.contains(document.activeElement)) {
                        setVisible(false);
                    }
                }, 150);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeAll();
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Search action
    const handleSearch = async () => {
        setLoading(true);
        setVisible(false);
        setShowResults(true);

        try {
            const res = await apiClient.get('/ai/scrape/search', {
                params: { q: selectedText, limit: 8 }
            });
            setSearchResults(res.data);
        } catch (e) {
            console.error('Search failed:', e);
            setSearchResults({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    // Copy action
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(selectedText);
            setCopied(true);
            setTimeout(() => setVisible(false), 600);
        } catch (e) {
            console.error('Copy failed:', e);
        }
    };

    // Save to notes action
    const handleSaveToNotes = () => {
        setVisible(false);
        setShowNotebookBrowser(true);
    };

    // Close all
    const closeAll = () => {
        setVisible(false);
        setShowResults(false);
        setShowNotebookBrowser(false);
        setSearchResults(null);
    };

    return (
        <>
            {/* Selection Popup - Floating toolbar */}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        ref={popupRef}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="fixed z-[9999] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                        style={{
                            left: position.x,
                            top: position.y,
                            transform: 'translateX(-50%)',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(139, 92, 246, 0.95))',
                        }}
                    >
                        <div className="flex items-center gap-1 p-1">
                            <PopupButton
                                icon={Search}
                                label="Search"
                                onClick={handleSearch}
                                primary
                            />
                            <PopupButton
                                icon={BookOpen}
                                label="Save"
                                onClick={handleSaveToNotes}
                            />
                            <PopupButton
                                icon={copied ? Check : Copy}
                                label={copied ? "Done" : "Copy"}
                                onClick={handleCopy}
                                success={copied}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Results Panel */}
            <AnimatePresence>
                {showResults && (
                    <SearchResultsPanel
                        loading={loading}
                        results={searchResults}
                        selectedText={selectedText}
                        onClose={closeAll}
                        onSaveToNotes={() => {
                            setShowResults(false);
                            setShowNotebookBrowser(true);
                        }}
                        onRefresh={handleSearch}
                    />
                )}
            </AnimatePresence>

            {/* Notebook Browser Modal */}
            <AnimatePresence>
                {showNotebookBrowser && (
                    <NotebookBrowserModal
                        content={searchResults?.scrapedContent?.[0] || { text: selectedText }}
                        selectedText={selectedText}
                        onClose={closeAll}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// Popup Button - Glass style
function PopupButton({ icon: Icon, label, onClick, primary, success }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${success
                    ? 'bg-emerald-500/20 text-emerald-100'
                    : primary
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}

// Search Results Panel - Elaborate slide-in
function SearchResultsPanel({ loading, results, selectedText, onClose, onSaveToNotes, onRefresh }) {
    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9997]"
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-[480px] max-w-[90vw] z-[9998] overflow-hidden flex flex-col"
                style={{
                    background: 'var(--bg-primary, #ffffff)',
                }}
            >
                {/* Gradient Header */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
                    <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                                    <Globe className="w-4 h-4" />
                                    <span>Web Search Results</span>
                                </div>
                                <h2 className="text-xl font-bold text-white line-clamp-2">
                                    "{selectedText.slice(0, 60)}{selectedText.length > 60 ? '...' : ''}"
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onRefresh}
                                    disabled={loading}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        {!loading && results && !results.error && (
                            <div className="flex items-center gap-4 text-white/70 text-sm">
                                <span>{results.searchResults?.length || 0} results</span>
                                {results.scrapedContent?.length > 0 && (
                                    <span>• {results.scrapedContent.length} pages scraped</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Searching the web...</p>
                        </div>
                    )}

                    {!loading && results?.error && (
                        <div className="flex flex-col items-center justify-center h-64 p-6">
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                <X className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium mb-2">Search Failed</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">{results.error}</p>
                        </div>
                    )}

                    {!loading && results && !results.error && (
                        <div className="p-4 space-y-3">
                            {/* Search Results */}
                            {results.searchResults?.map((result, idx) => (
                                <motion.a
                                    key={idx}
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="block p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {result.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                                {result.snippet}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                                    {result.source || 'Web'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </motion.a>
                            ))}

                            {/* Scraped Content */}
                            {results.scrapedContent?.map((content, idx) => (
                                <motion.div
                                    key={`scraped-${idx}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (results.searchResults?.length || 0) * 0.05 + idx * 0.05 }}
                                    className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                >
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-purple-500" />
                                        {content.title}
                                    </h4>

                                    {content.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {content.description}
                                        </p>
                                    )}

                                    {/* Images */}
                                    {content.images?.length > 0 && (
                                        <div className="mb-3">
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-2 flex items-center gap-1">
                                                <Image className="w-3 h-3" />
                                                Images ({content.images.length})
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                                                {content.images.slice(0, 6).map((img, imgIdx) => (
                                                    <img
                                                        key={imgIdx}
                                                        src={img.url}
                                                        alt={img.alt || ''}
                                                        className="w-24 h-24 object-cover rounded-xl flex-shrink-0 border border-gray-200 dark:border-gray-700"
                                                        onError={(e) => e.target.style.display = 'none'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Videos */}
                                    {content.videos?.length > 0 && (
                                        <div>
                                            <div className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-2 flex items-center gap-1">
                                                <Video className="w-3 h-3" />
                                                Videos ({content.videos.length})
                                            </div>
                                            <div className="space-y-2">
                                                {content.videos.slice(0, 3).map((vid, vidIdx) => (
                                                    <a
                                                        key={vidIdx}
                                                        href={vid.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    >
                                                        {vid.thumbnail && (
                                                            <img src={vid.thumbnail} alt="" className="w-20 h-12 object-cover rounded-lg" />
                                                        )}
                                                        <div className="flex-1">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                                {vid.platform}
                                                            </span>
                                                        </div>
                                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Empty State */}
                            {(!results.searchResults?.length && !results.scrapedContent?.length) && (
                                <div className="flex flex-col items-center justify-center h-40">
                                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-600 dark:text-gray-400">No results found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onSaveToNotes}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                    >
                        <BookOpen className="w-5 h-5" />
                        Save to Notes
                    </button>
                </div>
            </motion.div>
        </>
    );
}

// Notebook Browser Modal
function NotebookBrowserModal({ content, selectedText, onClose }) {
    const [notebooks, setNotebooks] = useState([]);
    const [selectedNotebook, setSelectedNotebook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [noteTitle, setNoteTitle] = useState(content?.title || `Note: ${selectedText.slice(0, 30)}...`);

    useEffect(() => {
        loadNotebooks();
    }, []);

    const loadNotebooks = async () => {
        try {
            const res = await apiClient.get('/notes/notebooks');
            setNotebooks(res.data || []);
        } catch (e) {
            console.error('Failed to load notebooks:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedNotebook) return;

        setSaving(true);
        try {
            await apiClient.post('/ai/scrape/save-to-notes', {
                title: noteTitle,
                content: content?.text || selectedText,
                notebookId: selectedNotebook.id,
                imageUrls: content?.images?.map(i => i.url) || [],
                videoUrls: content?.videos?.map(v => v.url) || [],
                sourceUrl: content?.url
            });
            onClose();
        } catch (e) {
            console.error('Save failed:', e);
            alert('Failed to save note');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-600">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Save to Notes</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Note Title */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                            Note Title
                        </label>
                        <input
                            type="text"
                            value={noteTitle}
                            onChange={e => setNoteTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-0 transition-colors"
                            placeholder="Enter note title..."
                        />
                    </div>

                    {/* Notebook Selection */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                            Select Notebook
                        </label>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        ) : notebooks.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                <FolderPlus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-900 dark:text-gray-100 font-medium">No notebooks found</p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Create one in Notes first</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {notebooks.map(notebook => (
                                    <button
                                        key={notebook.id}
                                        onClick={() => setSelectedNotebook(notebook)}
                                        className={`w-full p-4 rounded-xl text-left transition-all ${selectedNotebook?.id === notebook.id
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
                                                : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                                            {notebook.name}
                                        </div>
                                        {notebook.sections?.length > 0 && (
                                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {notebook.sections.length} sections
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                            Preview
                        </label>
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl max-h-24 overflow-y-auto border border-gray-200 dark:border-gray-700">
                            {(content?.text || selectedText).slice(0, 200)}...
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedNotebook || saving}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Note'
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
