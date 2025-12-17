/**
 * NotesPage - Fresh implementation with Zustand + React Query
 * Clean architecture with proper state management
 */
import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Folder, ChevronRight, ChevronDown, ChevronLeft,
    Star, Sidebar, Share2, Clock, Trash2, Search, Grid, List,
    Sparkles, FileText, MoreHorizontal, ZoomIn, ZoomOut
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Store and hooks
import { useNotesStore } from '../stores/notesStore';
import {
    useNotebooks,
    useSections,
    useNotes,
    useNote,
    useCreateNote,
    useDeleteNote,
    useAutoSave,
    useCreateNotebook,
    useCreateSection,
} from '../hooks/useNotes';

// Components
import RichNoteEditor from '../components/RichNoteEditor';
import ErrorBoundary from '../components/ErrorBoundary';
import CreateNotebookModal from '../components/modals/CreateNotebookModal';
import CreateChapterModal from '../components/modals/CreateChapterModal';
import ShareNoteModal from '../components/modals/ShareNoteModal';
import NoteVersionsModal from '../components/modals/NoteVersionsModal';
import AIToolsPanel from '../components/AIToolsPanel';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Create query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// ====================
// Helper function
// ====================
const getDisplayTitle = (note) => {
    if (note.title && note.title.trim() !== '' && note.title !== 'Untitled Note') {
        return note.title;
    }
    try {
        let contentText = '';
        if (typeof note.content === 'object' && note.content !== null) {
            const extractText = (node) => {
                if (node.text) return node.text;
                if (node.content) return node.content.map(extractText).join(' ');
                return '';
            };
            contentText = extractText(note.content);
        }
        if (contentText.trim()) {
            return contentText.trim().slice(0, 30) + (contentText.length > 30 ? '...' : '');
        }
    } catch (e) { }
    return 'Untitled';
};

// ====================
// Sidebar Component
// ====================
function NotesSidebar() {
    const {
        notebooks,
        expandedNotebook,
        sections,
        selectedSection,
        sidebarOpen,
        searchQuery,
        setExpandedNotebook,
        setSelectedSection,
        setSearchQuery,
        toggleSidebar,
    } = useNotesStore();

    const { data: notebooksData, isLoading: notebooksLoading } = useNotebooks();
    const { data: sectionsData } = useSections(expandedNotebook);

    const [showCreateNotebook, setShowCreateNotebook] = React.useState(false);
    const [showCreateChapter, setShowCreateChapter] = React.useState(false);
    const [notebookForChapter, setNotebookForChapter] = React.useState(null);

    const createNotebook = useCreateNotebook();
    const createSection = useCreateSection();

    const handleToggleNotebook = (notebookId) => {
        setExpandedNotebook(expandedNotebook === notebookId ? null : notebookId);
    };

    const handleSelectChapter = (chapter) => {
        setSelectedSection(chapter);
    };

    const handleCreateNotebook = async (title, color) => {
        await createNotebook.mutateAsync({ title, color });
        setShowCreateNotebook(false);
    };

    const handleCreateChapter = async (title) => {
        if (notebookForChapter) {
            await createSection.mutateAsync({ notebookId: notebookForChapter.id, title });
            setShowCreateChapter(false);
            setNotebookForChapter(null);
        }
    };

    if (!sidebarOpen) return null;

    return (
        <>
            <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 space-y-4 border-b border-gray-200 dark:border-gray-800">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Notebooks Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Notebooks</h2>
                        <button
                            onClick={() => setShowCreateNotebook(true)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="New Notebook"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {/* Notebook List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {notebooksLoading ? (
                        <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
                    ) : (
                        notebooks.map((notebook) => (
                            <div key={notebook.id} className="space-y-1">
                                {/* Notebook */}
                                <button
                                    onClick={() => handleToggleNotebook(notebook.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${expandedNotebook === notebook.id
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <span style={{ color: notebook.color }}>
                                        <Folder size={16} fill={expandedNotebook === notebook.id ? 'currentColor' : 'none'} />
                                    </span>
                                    <span className="flex-1 text-left truncate font-medium">{notebook.title}</span>
                                    {expandedNotebook === notebook.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>

                                {/* Chapters (Sections) */}
                                <AnimatePresence>
                                    {expandedNotebook === notebook.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden ml-4 border-l border-gray-200 dark:border-gray-700 pl-2 space-y-0.5"
                                        >
                                            {sections[notebook.id]?.map((chapter) => (
                                                <button
                                                    key={chapter.id}
                                                    onClick={() => handleSelectChapter(chapter)}
                                                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm text-left transition-colors ${selectedSection?.id === chapter.id
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    {chapter.title}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    setNotebookForChapter(notebook);
                                                    setShowCreateChapter(true);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            >
                                                <Plus size={12} /> Add Chapter
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>
            </motion.aside>

            {/* Modals */}
            {showCreateNotebook && (
                <CreateNotebookModal
                    onClose={() => setShowCreateNotebook(false)}
                    onCreate={handleCreateNotebook}
                />
            )}
            {showCreateChapter && (
                <CreateChapterModal
                    onClose={() => {
                        setShowCreateChapter(false);
                        setNotebookForChapter(null);
                    }}
                    onCreate={handleCreateChapter}
                />
            )}
        </>
    );
}

// ====================
// Notes List Component
// ====================
function NotesList({ onSelectNote }) {
    const { selectedSection, notes, viewMode } = useNotesStore();
    const { isLoading } = useNotes(selectedSection?.id);
    const createNote = useCreateNote();

    const handleCreateNote = async () => {
        if (!selectedSection) return;
        await createNote.mutateAsync({
            sectionId: selectedSection.id,
            title: 'Untitled Note',
            content: { type: 'doc', content: [] },
        });
    };

    if (!selectedSection) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
                <Folder size={48} strokeWidth={1} className="mb-4" />
                <h2 className="text-xl font-medium text-gray-600 dark:text-gray-300">Select a Notebook</h2>
                <p className="text-sm mt-2">Choose a chapter from the sidebar to view notes.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-medium text-gray-900 dark:text-white">
                        {selectedSection.title}
                    </h1>
                    <button
                        onClick={handleCreateNote}
                        disabled={createNote.isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <Plus size={16} />
                        New Note
                    </button>
                </div>

                {/* Notes Grid/List */}
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading notes...</div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        No notes yet. Create your first note!
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                        {notes.map((note) => (
                            <motion.div
                                key={note.id}
                                layoutId={`note-${note.id}`}
                                onClick={() => onSelectNote(note)}
                                className={`group cursor-pointer transition-all duration-200 ${viewMode === 'grid'
                                        ? 'flex flex-col p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg'
                                        : 'flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                                    }`}
                            >
                                {viewMode === 'list' && (
                                    <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500 transition-colors">
                                        <FileText size={18} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    {viewMode === 'grid' && (
                                        <div className="mb-3 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 w-fit group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-500 transition-colors">
                                            <FileText size={18} />
                                        </div>
                                    )}
                                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                        {getDisplayTitle(note)}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span>
                                            {note.updatedAt
                                                ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })
                                                : 'Just now'}
                                        </span>
                                        {note.isPinned && (
                                            <span className="text-amber-400 flex items-center gap-1">
                                                <Star size={10} fill="currentColor" /> Pinned
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ====================
// Editor Component
// ====================
function NoteEditor({ noteId, onBack }) {
    const { selectedNote, saveStatus, editorZoom, zoomIn, zoomOut, updateSelectedNoteTitle, updateSelectedNoteContent } = useNotesStore();
    const { isLoading, error } = useNote(noteId);
    const { scheduleSave, saveNow } = useAutoSave(noteId);
    const deleteNote = useDeleteNote();

    const [showShareModal, setShowShareModal] = React.useState(false);
    const [showVersionsModal, setShowVersionsModal] = React.useState(false);
    const [showAITools, setShowAITools] = React.useState(false);

    // Handle content change
    const handleContentChange = useCallback((content) => {
        updateSelectedNoteContent(content);
        scheduleSave(selectedNote?.title, content);
    }, [selectedNote?.title, scheduleSave, updateSelectedNoteContent]);

    // Handle title change
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        updateSelectedNoteTitle(newTitle);
        scheduleSave(newTitle, selectedNote?.content);
    };

    // Handle back - save first
    const handleBack = async () => {
        await saveNow();
        onBack();
    };

    // Handle delete
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            await deleteNote.mutateAsync(noteId);
            onBack();
        }
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                Loading note...
            </div>
        );
    }

    if (error || !selectedNote) {
        return (
            <div className="h-full flex items-center justify-center text-red-500">
                Failed to load note
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Editor Header */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {selectedNote.title}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Save Status */}
                    <span className={`text-xs ${saveStatus === 'saving' ? 'text-amber-500' :
                            saveStatus === 'error' ? 'text-red-500' :
                                'text-gray-400'
                        }`}>
                        {saveStatus === 'saving' ? 'Saving...' :
                            saveStatus === 'error' ? 'Error!' :
                                'Saved'}
                    </span>

                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

                    {/* Zoom */}
                    <button onClick={zoomOut} className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded" title="Zoom Out">
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs text-gray-500 w-10 text-center">{editorZoom}%</span>
                    <button onClick={zoomIn} className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded" title="Zoom In">
                        <ZoomIn size={16} />
                    </button>

                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

                    {/* Actions */}
                    <button
                        onClick={() => setShowAITools(!showAITools)}
                        className={`p-1.5 rounded ${showAITools ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        title="AI Tools"
                    >
                        <Sparkles size={16} />
                    </button>
                    <button onClick={() => setShowVersionsModal(true)} className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded" title="History">
                        <Clock size={16} />
                    </button>
                    <button onClick={() => setShowShareModal(true)} className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded" title="Share">
                        <Share2 size={16} />
                    </button>
                    <button onClick={handleDelete} className="p-1.5 text-red-500 hover:text-red-600 rounded" title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </header>

            {/* Editor Body */}
            <div className="flex-1 overflow-hidden flex">
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
                    <div
                        className="max-w-3xl mx-auto py-12 px-8 bg-white dark:bg-gray-900 min-h-full border-x border-gray-100 dark:border-gray-800"
                        style={{ transform: `scale(${editorZoom / 100})`, transformOrigin: 'top center' }}
                    >
                        <input
                            type="text"
                            value={selectedNote.title || ''}
                            onChange={handleTitleChange}
                            placeholder="Untitled Note"
                            className="w-full text-3xl font-medium bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-900 dark:text-white mb-6"
                        />
                        <ErrorBoundary>
                            <RichNoteEditor
                                key={noteId}
                                value={selectedNote.content}
                                onChange={handleContentChange}
                                noteId={noteId}
                            />
                        </ErrorBoundary>
                    </div>
                </main>

                {/* AI Tools Panel */}
                <AnimatePresence>
                    {showAITools && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 350, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
                        >
                            <AIToolsPanel noteId={noteId} onClose={() => setShowAITools(false)} />
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            {showShareModal && selectedNote && (
                <ShareNoteModal
                    noteId={selectedNote.id}
                    onClose={() => setShowShareModal(false)}
                    onShare={() => { }}
                />
            )}
            {showVersionsModal && selectedNote && (
                <NoteVersionsModal
                    noteId={selectedNote.id}
                    onClose={() => setShowVersionsModal(false)}
                    onRestore={() => { }}
                />
            )}
        </div>
    );
}

// ====================
// Main NotesPage Component
// ====================
function NotesPageContent() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { sidebarOpen, toggleSidebar, setSelectedNote, clearSelection } = useNotesStore();

    const [view, setView] = React.useState('list'); // 'list' | 'editor'
    const [currentNoteId, setCurrentNoteId] = React.useState(null);

    // Restore from URL
    useEffect(() => {
        const noteId = searchParams.get('note');
        if (noteId) {
            setCurrentNoteId(noteId);
            setView('editor');
        }
    }, [searchParams]);

    const handleSelectNote = (note) => {
        setCurrentNoteId(note.id);
        setView('editor');
        setSearchParams({ note: note.id });
    };

    const handleBackToList = () => {
        setCurrentNoteId(null);
        setView('list');
        clearSelection();
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('note');
        setSearchParams(newParams);
    };

    return (
        <div className="flex h-full w-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
            {/* Sidebar Toggle (mobile) */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg md:hidden"
            >
                <Sidebar size={20} />
            </button>

            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && <NotesSidebar />}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Bar */}
                <header className="h-12 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg"
                    >
                        <Sidebar size={18} />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {view === 'editor' && currentNoteId ? (
                        <NoteEditor noteId={currentNoteId} onBack={handleBackToList} />
                    ) : (
                        <NotesList onSelectNote={handleSelectNote} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ====================
// Export with Provider
// ====================
export default function NotesPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <NotesPageContent />
        </QueryClientProvider>
    );
}
