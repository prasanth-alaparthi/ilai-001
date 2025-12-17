import React, { useState } from 'react';
import { X, StickyNote, Save, Loader2 } from 'lucide-react';

/**
 * PostNoteModal - Add personal notes to a saved post
 */
const PostNoteModal = ({ isOpen, onClose, post, onSaveNote }) => {
    const [note, setNote] = useState(post?.existingNote || '');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen || !post) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveNote?.(post.id, note);
            onClose();
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <StickyNote className="w-5 h-5 text-yellow-400" />
                        <h2 className="text-lg font-semibold text-white">Add Personal Note</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Post Preview */}
                <div className="p-4 border-b border-white/10">
                    <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                            <span className="text-sm text-gray-400">{post.authorName}</span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">{post.content}</p>
                    </div>
                </div>

                {/* Note Input */}
                <div className="p-4">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Write your personal notes about this post..."
                        className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-yellow-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                        Notes are private and only visible to you.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-lg disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Note
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostNoteModal;
