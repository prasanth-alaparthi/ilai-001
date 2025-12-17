import React, { useState, useEffect, useRef } from 'react';
import { Hash, X } from 'lucide-react';
import feedService from '../../services/feedService';

/**
 * HashtagInput with autocomplete
 */
const HashtagInput = ({ hashtags, onChange, placeholder = "Add hashtags..." }) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (input.length > 1) {
                try {
                    const results = await feedService.suggestHashtags(input);
                    setSuggestions(results.slice(0, 6));
                    setShowSuggestions(true);
                } catch (error) {
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const debounce = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(debounce);
    }, [input]);

    const addHashtag = (tag) => {
        const cleanTag = tag.replace(/^#/, '').toLowerCase();
        if (cleanTag && !hashtags.includes(cleanTag)) {
            onChange([...hashtags, cleanTag]);
        }
        setInput('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const removeHashtag = (tag) => {
        onChange(hashtags.filter(h => h !== tag));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (input.trim()) {
                addHashtag(input.trim());
            }
        } else if (e.key === 'Backspace' && !input && hashtags.length > 0) {
            removeHashtag(hashtags[hashtags.length - 1]);
        }
    };

    return (
        <div className="relative">
            {/* Selected Hashtags */}
            <div className="flex flex-wrap gap-2 mb-2">
                {hashtags.map(tag => (
                    <span
                        key={tag}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1 text-sm"
                    >
                        <Hash className="w-3 h-3" />
                        {tag}
                        <button
                            onClick={() => removeHashtag(tag)}
                            className="ml-1 hover:text-red-400 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>

            {/* Input */}
            <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => input.length > 1 && setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg overflow-hidden z-20 shadow-xl">
                    {suggestions.map((tag, i) => (
                        <button
                            key={i}
                            onClick={() => addHashtag(tag)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 text-gray-300 flex items-center gap-2"
                        >
                            <Hash className="w-3 h-3 text-purple-400" />
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HashtagInput;
