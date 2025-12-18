/**
 * ILAI Hyper Platform - Collaborative Editor Hook
 * 
 * React hook that combines TipTap editor with Yjs CRDTs for:
 * - Real-time collaboration with multiple users
 * - Offline-first editing with IndexedDB persistence
 * - Cursor presence awareness
 * - Automatic conflict resolution
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';

import { getOrCreateDoc, destroyDoc, getEditorFragment } from '../lib/sync/crdt-store';
import {
    createSyncProvider,
    destroySyncProvider,
    getSyncStatus,
    getConnectedUsers,
    subscribeToAwareness,
} from '../lib/sync/websocket-sync';
import { storeNoteEmbedding, findRelatedNotes } from '../lib/semantic/semantic-linker';

/**
 * Hook for collaborative note editing
 * @param {string} noteId - The note ID
 * @param {object} user - Current user { id, name, email }
 * @param {object} options - Additional options
 */
export function useCollaborativeEditor(noteId, user, options = {}) {
    const {
        placeholder = 'Start writing...',
        onSave,
        autoSaveInterval = 5000,
    } = options;

    // State
    const [syncStatus, setSyncStatus] = useState({ connected: false, synced: false });
    const [collaborators, setCollaborators] = useState([]);
    const [relatedNotes, setRelatedNotes] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Refs
    const ydocRef = useRef(null);
    const providerRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    // Initialize Yjs document and provider
    useEffect(() => {
        if (!noteId || !user?.id) return;

        // Create Yjs document with IndexedDB persistence
        const { doc, persistence } = getOrCreateDoc(noteId);
        ydocRef.current = doc;

        // Create WebSocket sync provider
        const provider = createSyncProvider(noteId, doc, {
            id: user.id,
            name: user.name || user.email || 'Anonymous',
            color: user.color,
        });
        providerRef.current = provider;

        // Update sync status
        const updateStatus = () => {
            setSyncStatus(getSyncStatus(noteId));
        };

        provider.on('status', updateStatus);
        provider.on('sync', updateStatus);

        // Subscribe to awareness (collaborators)
        const unsubscribe = subscribeToAwareness(noteId, (users) => {
            setCollaborators(users);
        });

        // Cleanup
        return () => {
            unsubscribe();
            destroySyncProvider(noteId);
            destroyDoc(noteId);
        };
    }, [noteId, user?.id, user?.name, user?.email]);

    // Create TipTap editor with collaboration extensions
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Disable built-in history, use CRDT history instead
                history: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Highlight.configure({
                multicolor: true,
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            // Collaboration extension - syncs content via CRDT
            Collaboration.configure({
                document: ydocRef.current,
                fragment: ydocRef.current ? getEditorFragment(ydocRef.current) : undefined,
            }),
            // Collaboration cursor - shows other users' cursors
            CollaborationCursor.configure({
                provider: providerRef.current,
                user: {
                    name: user?.name || 'Anonymous',
                    color: user?.color || '#4ECDC4',
                },
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            // Debounced auto-save and semantic indexing
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(async () => {
                const content = editor.getText();

                // Update semantic embeddings for auto-linking
                if (content.length > 50) {
                    try {
                        await storeNoteEmbedding(noteId, '', content);
                        const related = await findRelatedNotes(noteId, content, 5);
                        setRelatedNotes(related);
                    } catch (error) {
                        console.error('[Semantic] Failed to update embeddings:', error);
                    }
                }

                // Call onSave callback if provided
                if (onSave) {
                    setIsSaving(true);
                    try {
                        await onSave(editor.getJSON(), editor.getHTML());
                    } finally {
                        setIsSaving(false);
                    }
                }
            }, autoSaveInterval);
        },
    }, [ydocRef.current, providerRef.current, user]);

    // Manual save function
    const save = useCallback(async () => {
        if (!editor || !onSave) return;

        setIsSaving(true);
        try {
            await onSave(editor.getJSON(), editor.getHTML());
        } finally {
            setIsSaving(false);
        }
    }, [editor, onSave]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        editor,
        syncStatus,
        collaborators,
        relatedNotes,
        isSaving,
        save,
        isOffline: !syncStatus.connected,
    };
}

/**
 * Sync status indicator component
 */
export function SyncStatusIndicator({ status, collaborators = [] }) {
    const { connected, synced } = status;

    return (
        <div className="flex items-center gap-2 text-sm">
            {/* Connection status */}
            <div className="flex items-center gap-1">
                <div
                    className={`w-2 h-2 rounded-full ${connected
                            ? synced
                                ? 'bg-green-500'
                                : 'bg-yellow-500 animate-pulse'
                            : 'bg-red-500'
                        }`}
                />
                <span className="text-gray-400">
                    {connected ? (synced ? 'Synced' : 'Syncing...') : 'Offline'}
                </span>
            </div>

            {/* Collaborator avatars */}
            {collaborators.length > 0 && (
                <div className="flex -space-x-2">
                    {collaborators.slice(0, 3).map((user) => (
                        <div
                            key={user.clientId}
                            className="w-6 h-6 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-medium"
                            style={{ backgroundColor: user.color }}
                            title={user.name}
                        >
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    ))}
                    {collaborators.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-800 bg-gray-600 flex items-center justify-center text-xs">
                            +{collaborators.length - 3}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Related notes component (semantic auto-linking)
 */
export function RelatedNotes({ notes, onNoteClick }) {
    if (!notes || notes.length === 0) return null;

    return (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Related Notes
            </h4>
            <ul className="space-y-1">
                {notes.map((note) => (
                    <li key={note.noteId}>
                        <button
                            onClick={() => onNoteClick?.(note.noteId)}
                            className="text-sm text-blue-400 hover:text-blue-300 hover:underline truncate block w-full text-left"
                        >
                            {note.title || `Note ${note.noteId}`}
                            <span className="text-gray-500 ml-2">
                                ({Math.round(note.similarity * 100)}% match)
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default useCollaborativeEditor;
