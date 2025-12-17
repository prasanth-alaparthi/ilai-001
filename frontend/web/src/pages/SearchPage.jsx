import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, FileText, Rss, MessageCircle, Sparkles, Loader2,
    Filter, X, Clock, BookOpen, ChevronDown, Zap, Star, Crown
} from 'lucide-react';
import freeSearchService from '../services/freeSearchService';
import { aiService } from '../services/aiService';
import { useBilling } from '../state/BillingContext';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isPremium } = useBilling?.() || { isPremium: false };

    // Search state
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchMode, setSearchMode] = useState(isPremium ? 'ai' : 'free'); // 'free' | 'ai'
    const [aiSummary, setAiSummary] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        notes: true,
        feed: true,
        chat: false
    });
    const [showFilters, setShowFilters] = useState(false);

    // Recent searches
    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        // Load recent searches from localStorage
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved).slice(0, 5));
        }
    }, []);

    useEffect(() => {
        // Auto-search if query in URL
        const q = searchParams.get('q');
        if (q && q !== query) {
            setQuery(q);
            performSearch(q);
        }
    }, [searchParams]);

    const saveRecentSearch = (q) => {
        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const performSearch = useCallback(async (searchQuery = query) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setAiSummary(null);
        saveRecentSearch(searchQuery);

        try {
            if (searchMode === 'free') {
                // BM25 keyword search (free tier)
                const res = await freeSearchService.search(searchQuery, {
                    notes: filters.notes,
                    feed: filters.feed,
                    limit: 20
                });
                setResults(res.results || res || []);
            } else {
                // AI semantic search (premium)
                const res = await aiService.unifiedSearch(searchQuery, 20);
                setResults(res.results || res || []);

                // Get AI summary for premium users
                if (isPremium && res.results?.length > 0) {
                    try {
                        const summaryRes = await aiService.smartSearch(searchQuery);
                        setAiSummary(summaryRes.summary || summaryRes.insight);
                    } catch (e) {
                        console.error('Failed to get AI summary:', e);
                    }
                }
            }

            // Update URL
            setSearchParams({ q: searchQuery });
        } catch (err) {
            console.error('Search failed:', err);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [query, searchMode, filters, isPremium]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    };

    const getResultIcon = (type) => {
        switch (type) {
            case 'note': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'post':
            case 'feed': return <Rss className="w-4 h-4 text-orange-500" />;
            case 'chat':
            case 'message': return <MessageCircle className="w-4 h-4 text-green-500" />;
            default: return <BookOpen className="w-4 h-4 text-purple-500" />;
        }
    };

    const handleResultClick = (result) => {
        if (result.type === 'note') {
            navigate(`/notes?noteId=${result.id}`);
        } else if (result.type === 'post' || result.type === 'feed') {
            navigate('/feed');
        } else if (result.type === 'chat' || result.type === 'message') {
            navigate('/chat');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
                    <Search className="w-8 h-8 text-indigo-500" />
                    Study Search
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-2">
                    Search across all your notes, journal, and feed
                </p>
            </div>

            {/* Search Mode Toggle */}
            <div className="mb-4 flex gap-2">
                <button
                    onClick={() => setSearchMode('free')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${searchMode === 'free'
                            ? 'bg-green-600 text-white'
                            : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                        }`}
                >
                    <Zap className="w-4 h-4" />
                    Fast Search
                    <span className="text-xs opacity-75">(Free)</span>
                </button>
                <button
                    onClick={() => setSearchMode('ai')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${searchMode === 'ai'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                            : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    AI Search
                    {!isPremium && <Crown className="w-3 h-3 text-yellow-400" />}
                </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={searchMode === 'ai'
                                ? "Ask anything about your notes..."
                                : "Search for keywords..."
                            }
                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                        />
                    </div>
                    <button
                        onClick={() => performSearch()}
                        disabled={isLoading || !query.trim()}
                        className="px-6 py-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5" />
                        )}
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-4 rounded-xl border transition-colors ${showFilters
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                                : 'border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800'
                            }`}
                    >
                        <Filter className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                    </button>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700"
                        >
                            <div className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                                Search in:
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { key: 'notes', label: 'Notes', icon: FileText },
                                    { key: 'feed', label: 'Feed Posts', icon: Rss },
                                    { key: 'chat', label: 'Chat Messages', icon: MessageCircle }
                                ].map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilters(f => ({ ...f, [key]: !f[key] }))}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filters[key]
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Recent Searches */}
            {!results.length && !isLoading && recentSearches.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-surface-500 mb-3">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setQuery(search);
                                    performSearch(search);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-sm hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                            >
                                {search}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Summary (Premium) */}
            <AnimatePresence>
                {aiSummary && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                                    AI Summary
                                </div>
                                <p className="text-surface-700 dark:text-surface-300">{aiSummary}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                    <p className="text-surface-500">
                        {searchMode === 'ai' ? 'AI is searching...' : 'Searching...'}
                    </p>
                </div>
            )}

            {/* Results */}
            {!isLoading && results.length > 0 && (
                <div>
                    <div className="text-sm text-surface-500 mb-4">
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                    </div>
                    <div className="space-y-3">
                        {results.map((result, idx) => (
                            <motion.div
                                key={result.id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleResultClick(result)}
                                className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-colors group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                        {getResultIcon(result.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-surface-900 dark:text-surface-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {result.title || result.subject || 'Untitled'}
                                        </h3>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 mt-1">
                                            {result.excerpt || result.snippet || result.content?.substring(0, 200)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-surface-400">
                                            <span className="capitalize">{result.type}</span>
                                            {result.score && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3" />
                                                        {Math.round(result.score * 100)}% match
                                                    </span>
                                                </>
                                            )}
                                            {result.updatedAt && (
                                                <>
                                                    <span>•</span>
                                                    <span>{new Date(result.updatedAt).toLocaleDateString()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {!isLoading && query && results.length === 0 && (
                <div className="text-center py-12">
                    <Search className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
                        No results found
                    </h3>
                    <p className="text-surface-500">
                        Try different keywords or adjust your filters
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
