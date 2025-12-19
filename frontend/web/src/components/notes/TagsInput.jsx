import React, { useState, useEffect } from 'react';
import { Tag, X, Plus, Check } from 'lucide-react';
import { notesService } from '../../services/notesService';

const TagsInput = ({ noteId, initialTags = [], onTagsChange }) => {
    const [tags, setTags] = useState(initialTags || []);
    const [inputValue, setInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setTags(initialTags || []);
    }, [initialTags]);

    const handleAddTag = async (e) => {
        e.preventDefault();
        const newTag = inputValue.trim().toLowerCase();
        if (!newTag || tags.includes(newTag)) {
            setInputValue('');
            return;
        }

        const newTags = [...tags, newTag];
        setTags(newTags);
        setInputValue('');
        await saveTags(newTags);
    };

    const handleRemoveTag = async (tagToRemove) => {
        const newTags = tags.filter(t => t !== tagToRemove);
        setTags(newTags);
        await saveTags(newTags);
    };

    const saveTags = async (newTags) => {
        setIsSaving(true);
        try {
            await notesService.updateTags(noteId, newTags);
            onTagsChange?.(newTags);
        } catch (error) {
            console.error('Failed to save tags:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const tagColors = [
        'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'bg-purple-500/20 text-purple-400 border-purple-500/30',
        'bg-green-500/20 text-green-400 border-green-500/30',
        'bg-amber-500/20 text-amber-400 border-amber-500/30',
        'bg-pink-500/20 text-pink-400 border-pink-500/30',
        'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    ];

    const getTagColor = (tag) => {
        const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return tagColors[hash % tagColors.length];
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Display Tags */}
            {tags.map((tag) => (
                <span
                    key={tag}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${getTagColor(tag)}`}
                >
                    <Tag size={10} />
                    {tag}
                    <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                        <X size={10} />
                    </button>
                </span>
            ))}

            {/* Add Tag Input */}
            {isEditing ? (
                <form onSubmit={handleAddTag} className="flex items-center gap-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Add tag..."
                        className="w-24 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-primary-500 text-white placeholder:text-surface-500"
                        autoFocus
                        onBlur={() => {
                            if (!inputValue) setIsEditing(false);
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="p-1 rounded-full bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={12} />
                    </button>
                </form>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-surface-400 border border-dashed border-white/20 hover:bg-white/10 hover:text-white transition-all"
                >
                    <Plus size={10} />
                    Add tag
                </button>
            )}

            {/* Saving indicator */}
            {isSaving && (
                <span className="text-xs text-surface-500 animate-pulse">Saving...</span>
            )}
        </div>
    );
};

export default TagsInput;
