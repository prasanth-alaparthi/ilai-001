import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDualMode } from '../hooks/useDualMode';
import freeSearchService from '../services/freeSearchService';
import './SmartSearch.css';

/**
 * SmartSearch Component
 * Unified search UI that works in both Free and AI modes
 */
const SmartSearch = ({
    placeholder = "Search notes, feed, and more...",
    onResultSelect,
    className = ""
}) => {
    const { isAIMode, executeWithMode, modeLabel } = useDualMode();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);
    const navigate = useNavigate();

    // Debounced search
    const performSearch = useCallback(async (searchQuery) => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const searchResults = await executeWithMode(
                // Free mode search
                async () => {
                    const data = await freeSearchService.search(searchQuery);
                    return data.results || [];
                },
                // AI mode search (could add semantic search here later)
                async () => {
                    // For now, use same search - can be enhanced with AI
                    const data = await freeSearchService.search(searchQuery);
                    return data.results || [];
                }
            );
            setResults(searchResults.slice(0, 8)); // Limit results
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [executeWithMode]);

    // Handle input change with debounce
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce search
        debounceRef.current = setTimeout(() => {
            performSearch(value);
        }, 300);
    };

    // Handle result click
    const handleResultClick = (result) => {
        if (onResultSelect) {
            onResultSelect(result);
        } else {
            // Default navigation based on type
            if (result.type === 'note') {
                navigate(`/notes/${result.id}/edit`);
            } else if (result.type === 'article') {
                window.open(result.metadata?.url, '_blank');
            }
        }
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < results.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && results[selectedIndex]) {
                    handleResultClick(results[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
            default:
                break;
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Show dropdown when there's input
    useEffect(() => {
        setIsOpen(query.length > 0 && (results.length > 0 || loading));
    }, [query, results, loading]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'note': return '📝';
            case 'article': return '📰';
            case 'flashcard': return '🎴';
            default: return '📄';
        }
    };

    return (
        <div className={`smart-search ${className}`}>
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query && setIsOpen(true)}
                    placeholder={placeholder}
                    className="search-input"
                />
                {loading && <span className="search-loading">⟳</span>}
                <span className={`mode-indicator ${isAIMode ? 'ai' : 'free'}`}>
                    {isAIMode ? '✨' : '🔍'}
                </span>
            </div>

            {isOpen && (
                <div ref={dropdownRef} className="search-dropdown">
                    {loading ? (
                        <div className="search-loading-state">
                            <span>Searching...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <>
                            <div className="search-results">
                                {results.map((result, index) => (
                                    <div
                                        key={result.id}
                                        className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                                        onClick={() => handleResultClick(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <span className="result-icon">{getTypeIcon(result.type)}</span>
                                        <div className="result-content">
                                            <div className="result-title">{result.title}</div>
                                            {result.snippet && (
                                                <div className="result-snippet">{result.snippet}</div>
                                            )}
                                        </div>
                                        <span className="result-type">{result.type}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="search-footer">
                                <span>{results.length} results</span>
                                <span className="mode-badge">{modeLabel}</span>
                            </div>
                        </>
                    ) : query.length > 0 ? (
                        <div className="search-empty">
                            <span>No results found for "{query}"</span>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default SmartSearch;
