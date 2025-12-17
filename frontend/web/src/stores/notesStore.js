/**
 * Notes Store - Zustand-based state management
 * Clean, simple state with no race conditions
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useNotesStore = create(
    devtools(
        persist(
            (set, get) => ({
                // ===================
                // State
                // ===================

                // Notebooks & Sections
                notebooks: [],
                expandedNotebook: null,
                sections: {}, // { notebookId: [...sections] }
                selectedSection: null,

                // Notes
                notes: [],
                selectedNote: null,

                // Editor state
                saveStatus: 'saved', // 'saved' | 'saving' | 'error'
                editorZoom: 100, // 100%

                // UI state
                sidebarOpen: true,
                viewMode: 'list', // 'list' | 'grid'
                searchQuery: '',

                // ===================
                // Actions
                // ===================

                // Notebooks
                setNotebooks: (notebooks) => set({ notebooks }),
                setExpandedNotebook: (notebookId) => set({ expandedNotebook: notebookId }),

                // Sections
                setSections: (notebookId, sections) =>
                    set((state) => ({
                        sections: { ...state.sections, [notebookId]: sections }
                    })),
                setSelectedSection: (section) => set({ selectedSection: section, notes: [], selectedNote: null }),

                // Notes
                setNotes: (notes) => set({ notes }),
                setSelectedNote: (note) => set({ selectedNote: note }),

                // Update selected note content (optimistic update)
                updateSelectedNoteContent: (content) =>
                    set((state) => ({
                        selectedNote: state.selectedNote
                            ? { ...state.selectedNote, content }
                            : null
                    })),

                // Update selected note title
                updateSelectedNoteTitle: (title) =>
                    set((state) => ({
                        selectedNote: state.selectedNote
                            ? { ...state.selectedNote, title }
                            : null,
                        notes: state.notes.map(n =>
                            n.id === state.selectedNote?.id ? { ...n, title } : n
                        )
                    })),

                // Save status
                setSaveStatus: (status) => set({ saveStatus: status }),

                // Editor zoom
                setEditorZoom: (zoom) => set({ editorZoom: Math.max(50, Math.min(200, zoom)) }),
                zoomIn: () => set((state) => ({ editorZoom: Math.min(200, state.editorZoom + 10) })),
                zoomOut: () => set((state) => ({ editorZoom: Math.max(50, state.editorZoom - 10) })),

                // UI
                toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
                setViewMode: (mode) => set({ viewMode: mode }),
                setSearchQuery: (query) => set({ searchQuery: query }),

                // Clear selection (when navigating away)
                clearSelection: () => set({
                    selectedNote: null,
                    selectedSection: null,
                    notes: []
                }),

                // Add new note to list
                addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),

                // Remove note from list
                removeNote: (noteId) => set((state) => ({
                    notes: state.notes.filter(n => n.id !== noteId),
                    selectedNote: state.selectedNote?.id === noteId ? null : state.selectedNote
                })),
            }),
            {
                name: 'notes-storage',
                partialize: (state) => ({
                    // Only persist UI preferences, not data
                    sidebarOpen: state.sidebarOpen,
                    viewMode: state.viewMode,
                    editorZoom: state.editorZoom,
                }),
            }
        ),
        { name: 'NotesStore' }
    )
);

// Selectors for common derived state
export const selectHasSelectedNote = (state) => !!state.selectedNote;
export const selectCanSave = (state) => state.saveStatus !== 'saving' && !!state.selectedNote;
