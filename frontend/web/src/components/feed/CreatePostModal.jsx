import React, { useState, useRef } from 'react';
import { X, Image, Hash, Globe, Users, Lock, Loader2, Sparkles } from 'lucide-react';
import feedService from '../../services/feedService';

/**
 * CreatePostModal - Modal for creating new feed posts
 */
const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
    const [content, setContent] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [hashtagInput, setHashtagInput] = useState('');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [contentType, setContentType] = useState('INSIGHT');
    const [difficultyLevel, setDifficultyLevel] = useState('MEDIUM');
    const [mediaUrls, setMediaUrls] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleHashtagKeyDown = async (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = hashtagInput.trim().replace(/^#/, '');
            if (tag && !hashtags.includes(tag)) {
                setHashtags([...hashtags, tag]);
            }
            setHashtagInput('');
            setSuggestions([]);
        }
    };

    const handleHashtagInput = async (value) => {
        setHashtagInput(value);
        if (value.length > 1) {
            try {
                const results = await feedService.suggestHashtags(value);
                setSuggestions(results.slice(0, 5));
            } catch (error) {
                console.error('Suggestion error:', error);
            }
        } else {
            setSuggestions([]);
        }
    };

    const addHashtag = (tag) => {
        if (!hashtags.includes(tag)) {
            setHashtags([...hashtags, tag]);
        }
        setHashtagInput('');
        setSuggestions([]);
    };

    const removeHashtag = (tag) => {
        setHashtags(hashtags.filter(h => h !== tag));
    };

    const handleSubmit = async () => {
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            const postData = {
                content: content.trim(),
                hashtags,
                mediaUrls,
                visibility,
                contentType,
                difficultyLevel
            };

            const newPost = await feedService.createPost(postData);
            onPostCreated?.(newPost);
            onClose();

            // Reset form
            setContent('');
            setHashtags([]);
            setMediaUrls([]);
        } catch (error) {
            console.error('Post creation error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const contentTypes = [
        { value: 'INSIGHT', label: '💡 Insight', desc: 'Share a learning' },
        { value: 'QUESTION', label: '❓ Question', desc: 'Ask the community' },
        { value: 'RESOURCE', label: '📚 Resource', desc: 'Share materials' },
        { value: 'DISCUSSION', label: '💬 Discussion', desc: 'Start a debate' }
    ];

    const difficulties = [
        { value: 'BEGINNER', label: 'Beginner', color: 'bg-green-500' },
        { value: 'EASY', label: 'Easy', color: 'bg-blue-500' },
        { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-500' },
        { value: 'HARD', label: 'Hard', color: 'bg-orange-500' },
        { value: 'ADVANCED', label: 'Advanced', color: 'bg-red-500' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-semibold text-white">Create Post</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Content Type Selector */}
                    <div className="grid grid-cols-4 gap-2">
                        {contentTypes.map(type => (
                            <button
                                key={type.value}
                                onClick={() => setContentType(type.value)}
                                className={`p-3 rounded-xl text-center transition-all ${contentType === type.value
                                        ? 'bg-purple-500/20 border-2 border-purple-500'
                                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <div className="text-lg">{type.label.split(' ')[0]}</div>
                                <div className="text-xs text-gray-400">{type.desc}</div>
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your knowledge..."
                        className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
                    />

                    {/* Media Preview */}
                    {mediaUrls.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                            {mediaUrls.map((url, i) => (
                                <div key={i} className="relative">
                                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg" />
                                    <button
                                        onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Hashtags */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Hashtags</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {hashtags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1"
                                >
                                    <Hash className="w-3 h-3" />
                                    {tag}
                                    <button onClick={() => removeHashtag(tag)} className="ml-1 hover:text-red-400">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={hashtagInput}
                                onChange={(e) => handleHashtagInput(e.target.value)}
                                onKeyDown={handleHashtagKeyDown}
                                placeholder="Add hashtag..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                            {suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg overflow-hidden z-10">
                                    {suggestions.map((tag, i) => (
                                        <button
                                            key={i}
                                            onClick={() => addHashtag(tag)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 text-gray-300"
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Difficulty Level */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Difficulty Level</label>
                        <div className="flex gap-2">
                            {difficulties.map(level => (
                                <button
                                    key={level.value}
                                    onClick={() => setDifficultyLevel(level.value)}
                                    className={`px-3 py-1 rounded-full text-sm transition-all ${difficultyLevel === level.value
                                            ? `${level.color} text-white`
                                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        }`}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visibility */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Visibility</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setVisibility('PUBLIC')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${visibility === 'PUBLIC' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                Public
                            </button>
                            <button
                                onClick={() => setVisibility('FRIENDS')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${visibility === 'FRIENDS' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                Friends
                            </button>
                            <button
                                onClick={() => setVisibility('PRIVATE')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${visibility === 'PRIVATE' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                Private
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-white/10">
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <Image className="w-5 h-5" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                // Handle file upload - would use Cloudinary
                                console.log('File selected:', e.target.files[0]);
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isSubmitting}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Posting...
                            </>
                        ) : (
                            'Post'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
