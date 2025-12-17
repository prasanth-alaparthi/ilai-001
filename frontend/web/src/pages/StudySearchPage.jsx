import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, X, Loader2, ExternalLink, BookOpen, FileText,
    ChevronDown, ChevronUp, Star, Clock, Globe, Sparkles, Crown
} from 'lucide-react';
import apiClient from '../services/apiClient';
import { useBilling } from '../state/BillingContext';

/**
 * StudySearchPage - Google-like unified search across local notes + web sources
 * Sources and categories are loaded dynamically from backend
 */
export default function StudySearchPage() {
    const { isPremium } = useBilling?.() || { isPremium: false };

    // Search state
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Filter state (loaded from backend)
    const [sources, setSources] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedSources, setSelectedSources] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [includeLocal, setIncludeLocal] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Recent searches
    const [recentSearches, setRecentSearches] = useState([]);

    // Load sources and categories from backend
    useEffect(() => {
        loadFilters();
        loadRecentSearches();
    }, []);

    const loadFilters = async () => {
        try {
            const [sourcesRes, categoriesRes] = await Promise.all([
                apiClient.get('/ai/study/sources'),
                apiClient.get('/ai/study/categories')
            ]);
            setSources(sourcesRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (e) {
            console.error('Failed to load filters:', e);
        }
    };

    const loadRecentSearches = () => {
        const saved = localStorage.getItem('studySearchHistory');
        if (saved) {
            setRecentSearches(JSON.parse(saved).slice(0, 5));
        }
    };

    const saveSearch = (q) => {
        const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('studySearchHistory', JSON.stringify(updated));
    };

    const performSearch = useCallback(async (searchQuery = query) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setSearched(true);
        saveSearch(searchQuery);

        try {
            const params = new URLSearchParams({
                q: searchQuery,
                local: includeLocal,
                limit: 30
            });

            if (selectedSources.length > 0) {
                params.append('sources', selectedSources.join(','));
            }
            if (selectedCategories.length > 0) {
                params.append('subjects', selectedCategories.join(','));
            }

            const res = await apiClient.get(`/ai/study/search?${params}`);
            setResults(res.data?.results || []);
        } catch (e) {
            console.error('Search failed:', e);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [query, selectedSources, selectedCategories, includeLocal]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    };

    const toggleSource = (code) => {
        setSelectedSources(prev =>
            prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]
        );
    };

    const toggleCategory = (code) => {
        setSelectedCategories(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const clearFilters = () => {
        setSelectedSources([]);
        setSelectedCategories([]);
        setIncludeLocal(true);
    };

    const getSourceIcon = (source) => {
        const found = sources.find(s => s.code === source);
        return found?.icon || '🔍';
    };

    const getSourceColor = (source) => {
        const found = sources.find(s => s.code === source);
        return found?.color || '#6B7280';
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        Study Search
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Search across your notes & {sources.length}+ educational sources
                    </p>
                </motion.div>

                {/* Search Box */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6"
                >
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Search for anything... papers, books, articles, your notes"
                                className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-lg transition-all"
                            />
                        </div>
                        <button
                            onClick={() => performSearch()}
                            disabled={loading || !query.trim()}
                            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-4 rounded-2xl border-2 transition-all ${showFilters
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                }`}
                        >
                            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Filters Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg"
                            >
                                {/* Subject Categories */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Subjects
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => (
                                            <button
                                                key={cat.code}
                                                onClick={() => toggleCategory(cat.code)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategories.includes(cat.code)
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {cat.icon} {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sources */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        <Globe className="w-4 h-4" /> Sources
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {sources.map(src => (
                                            <button
                                                key={src.code}
                                                onClick={() => toggleSource(src.code)}
                                                disabled={src.isPremium && !isPremium}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${selectedSources.includes(src.code)
                                                    ? 'bg-indigo-600 text-white'
                                                    : src.isPremium && !isPremium
                                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {src.icon} {src.name}
                                                {src.isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <input
                                            type="checkbox"
                                            checked={includeLocal}
                                            onChange={(e) => setIncludeLocal(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Include my notes
                                    </label>
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-indigo-600 hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Recent Searches */}
                {!searched && recentSearches.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-8"
                    >
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <Clock className="w-4 h-4" /> Recent searches
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((search, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setQuery(search);
                                        performSearch(search);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 transition-all shadow-sm"
                                >
                                    {search}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center gap-3 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <span className="text-lg">Searching {sources.length}+ sources...</span>
                        </div>
                    </div>
                )}

                {/* Results */}
                {!loading && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="text-sm text-gray-500 mb-4">
                            {results.length} results found
                        </div>
                        <div className="space-y-4">
                            {results.map((result, idx) => (
                                <motion.a
                                    key={result.id || idx}
                                    href={result.url}
                                    target={result.sourceCode === 'local' ? '_self' : '_blank'}
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="block p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Thumbnail or Icon */}
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                            style={{ backgroundColor: `${getSourceColor(result.sourceCode)}20` }}
                                        >
                                            {result.thumbnail ? (
                                                <img src={result.thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                <span>{result.sourceIcon || getSourceIcon(result.sourceCode)}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Title */}
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                                {result.title}
                                            </h3>

                                            {/* Snippet */}
                                            {result.snippet && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {result.snippet}
                                                </p>
                                            )}

                                            {/* Meta */}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                <span
                                                    className="px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: `${getSourceColor(result.sourceCode)}20`,
                                                        color: getSourceColor(result.sourceCode)
                                                    }}
                                                >
                                                    {result.sourceName}
                                                </span>
                                                {result.authors && (
                                                    <span className="truncate max-w-[200px]">{result.authors}</span>
                                                )}
                                                {result.publishedDate && (
                                                    <span>{result.publishedDate}</span>
                                                )}
                                            </div>
                                        </div>

                                        <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* No Results */}
                {!loading && searched && results.length === 0 && (
                    <div className="text-center py-16">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            No results found
                        </h3>
                        <p className="text-gray-500">
                            Try different keywords or adjust your filters
                        </p>
                    </div>
                )}

                {/* Initial State */}
                {!searched && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-2xl mx-auto">
                            {categories.slice(0, 5).map(cat => (
                                <button
                                    key={cat.code}
                                    onClick={() => {
                                        setSelectedCategories([cat.code]);
                                        setShowFilters(true);
                                    }}
                                    className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 transition-all flex flex-col items-center gap-2 group"
                                >
                                    <span className="text-3xl">{cat.icon}</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600">
                                        {cat.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
