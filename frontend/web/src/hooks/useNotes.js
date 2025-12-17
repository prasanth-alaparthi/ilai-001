/**
 * Notes Hooks - React Query for server state
 * Handles caching, refetching, optimistic updates
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useEffect } from 'react';
import { notesApi } from '../api/notesApi';
import { useNotesStore } from '../stores/notesStore';

// ====================
// Query Keys
// ====================
export const notesKeys = {
    all: ['notes'],
    notebooks: () => [...notesKeys.all, 'notebooks'],
    sections: (notebookId) => [...notesKeys.all, 'sections', notebookId],
    notes: (sectionId) => [...notesKeys.all, 'notes', sectionId],
    note: (noteId) => [...notesKeys.all, 'note', noteId],
    search: (query) => [...notesKeys.all, 'search', query],
    pinned: () => [...notesKeys.all, 'pinned'],
};

// ====================
// Notebooks
// ====================
export function useNotebooks() {
    const setNotebooks = useNotesStore((state) => state.setNotebooks);

    const query = useQuery({
        queryKey: notesKeys.notebooks(),
        queryFn: notesApi.getNotebooks,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Update store when data changes
    useEffect(() => {
        if (query.data) {
            setNotebooks(query.data);
        }
    }, [query.data, setNotebooks]);

    return query;
}

export function useCreateNotebook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ title, color }) => notesApi.createNotebook(title, color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notesKeys.notebooks() });
        },
    });
}

// ====================
// Sections  
// ====================
export function useSections(notebookId) {
    const setSections = useNotesStore((state) => state.setSections);

    const query = useQuery({
        queryKey: notesKeys.sections(notebookId),
        queryFn: () => notesApi.getSections(notebookId),
        enabled: !!notebookId,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (query.data && notebookId) {
            setSections(notebookId, query.data);
        }
    }, [query.data, notebookId, setSections]);

    return query;
}

export function useCreateSection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ notebookId, title }) => notesApi.createSection(notebookId, title),
        onSuccess: (_, { notebookId }) => {
            queryClient.invalidateQueries({ queryKey: notesKeys.sections(notebookId) });
        },
    });
}

// ====================
// Notes List
// ====================
export function useNotes(sectionId) {
    const setNotes = useNotesStore((state) => state.setNotes);

    const query = useQuery({
        queryKey: notesKeys.notes(sectionId),
        queryFn: () => notesApi.getNotes(sectionId),
        enabled: !!sectionId,
        staleTime: 30 * 1000, // 30 seconds
    });

    useEffect(() => {
        if (query.data) {
            setNotes(query.data);
        }
    }, [query.data, setNotes]);

    return query;
}

// ====================
// Single Note
// ====================
export function useNote(noteId) {
    const setSelectedNote = useNotesStore((state) => state.setSelectedNote);

    const query = useQuery({
        queryKey: notesKeys.note(noteId),
        queryFn: () => notesApi.getNote(noteId),
        enabled: !!noteId,
        staleTime: 10 * 1000, // 10 seconds
    });

    useEffect(() => {
        if (query.data) {
            console.log('[useNote] Loaded note:', query.data?.id, 'content length:', JSON.stringify(query.data?.content)?.length);
            setSelectedNote(query.data);
        }
    }, [query.data, setSelectedNote]);

    return query;
}

// ====================
// Create Note
// ====================
export function useCreateNote() {
    const queryClient = useQueryClient();
    const addNote = useNotesStore((state) => state.addNote);
    const setSelectedNote = useNotesStore((state) => state.setSelectedNote);

    return useMutation({
        mutationFn: ({ sectionId, title, content }) =>
            notesApi.createNote(sectionId, title, content),
        onSuccess: (newNote, { sectionId }) => {
            // Add to local state
            addNote(newNote);
            setSelectedNote(newNote);
            // Invalidate list query
            queryClient.invalidateQueries({ queryKey: notesKeys.notes(sectionId) });
        },
    });
}

// ====================
// Update Note - Core save functionality
// ====================
export function useUpdateNote() {
    const queryClient = useQueryClient();
    const setSaveStatus = useNotesStore((state) => state.setSaveStatus);
    const selectedNote = useNotesStore((state) => state.selectedNote);

    return useMutation({
        mutationFn: ({ noteId, title, content }) =>
            notesApi.updateNote(noteId, title, content),

        // Called before mutation runs
        onMutate: async ({ noteId, title, content }) => {
            console.log('[useUpdateNote] onMutate - starting save for:', noteId);
            setSaveStatus('saving');

            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: notesKeys.note(noteId) });

            // Snapshot previous value
            const previousNote = queryClient.getQueryData(notesKeys.note(noteId));

            // Optimistically update cache
            queryClient.setQueryData(notesKeys.note(noteId), (old) => ({
                ...old,
                title,
                content,
                updatedAt: new Date().toISOString(),
            }));

            return { previousNote };
        },

        // If mutation fails, rollback
        onError: (err, variables, context) => {
            console.error('[useUpdateNote] onError - save failed:', err);
            setSaveStatus('error');

            if (context?.previousNote) {
                queryClient.setQueryData(
                    notesKeys.note(variables.noteId),
                    context.previousNote
                );
            }
        },

        // Always refetch after error or success
        onSettled: (data, error, variables) => {
            if (!error) {
                console.log('[useUpdateNote] onSettled - save successful:', data?.id, data?.updatedAt);
                setSaveStatus('saved');
                // Update cache with server response
                queryClient.setQueryData(notesKeys.note(variables.noteId), data);
            }
        },
    });
}

// ====================
// Delete Note
// ====================
export function useDeleteNote() {
    const queryClient = useQueryClient();
    const removeNote = useNotesStore((state) => state.removeNote);
    const selectedSection = useNotesStore((state) => state.selectedSection);

    return useMutation({
        mutationFn: (noteId) => notesApi.deleteNote(noteId),
        onSuccess: (_, noteId) => {
            removeNote(noteId);
            if (selectedSection) {
                queryClient.invalidateQueries({ queryKey: notesKeys.notes(selectedSection.id) });
            }
        },
    });
}

// ====================
// Debounced Auto-Save Hook
// ====================
export function useAutoSave(noteId, debounceMs = 1000) {
    const updateNote = useUpdateNote();
    const saveTimeoutRef = useRef(null);
    const pendingContentRef = useRef(null);
    const pendingTitleRef = useRef(null);

    // Schedule a save
    const scheduleSave = useCallback((title, content) => {
        // Store latest values
        pendingTitleRef.current = title;
        pendingContentRef.current = content;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Schedule new save
        saveTimeoutRef.current = setTimeout(() => {
            if (noteId && pendingContentRef.current !== null) {
                console.log('[useAutoSave] Executing save for:', noteId);
                updateNote.mutate({
                    noteId,
                    title: pendingTitleRef.current,
                    content: pendingContentRef.current,
                });
            }
        }, debounceMs);
    }, [noteId, debounceMs, updateNote]);

    // Cancel pending save on unmount or noteId change
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [noteId]);

    // Immediate save (for before navigation)
    const saveNow = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        if (noteId && pendingContentRef.current !== null) {
            return updateNote.mutateAsync({
                noteId,
                title: pendingTitleRef.current,
                content: pendingContentRef.current,
            });
        }
        return Promise.resolve();
    }, [noteId, updateNote]);

    return {
        scheduleSave,
        saveNow,
        isSaving: updateNote.isLoading,
        isError: updateNote.isError,
        error: updateNote.error,
    };
}

// ====================
// Search
// ====================
export function useSearchNotes(query) {
    return useQuery({
        queryKey: notesKeys.search(query),
        queryFn: () => notesApi.searchNotes(query),
        enabled: !!query && query.length > 2,
        staleTime: 30 * 1000,
    });
}

// ====================
// Pinned Notes
// ====================
export function usePinnedNotes() {
    return useQuery({
        queryKey: notesKeys.pinned(),
        queryFn: notesApi.getPinnedNotes,
        staleTime: 60 * 1000,
    });
}

export function useTogglePin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (noteId) => notesApi.togglePin(noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notesKeys.pinned() });
        },
    });
}
