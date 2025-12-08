import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Check, X, RefreshCw, Plus, Search, Trash2, ExternalLink } from 'lucide-react';

export default function FeedCustomization() {
    const [sources, setSources] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newFeed, setNewFeed] = useState({ url: '', name: '', category: 'Custom' });
    const [adding, setAdding] = useState(false);

    const categoryOptions = ['Science', 'Space', 'Technology', 'Education', 'History', 'Mathematics', 'Arts', 'Environment', 'Philosophy', 'Custom'];

    useEffect(() => {
        loadSources();
    }, []);

    const loadSources = async () => {
        try {
            const res = await apiClient.get('/feed/sources/by-category');
            setSources(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load feed sources', err);
            setLoading(false);
        }
    };

    const toggleSource = async (sourceId) => {
        try {
            await apiClient.put(`/feed/sources/${sourceId}/toggle`);
            loadSources();
        } catch (err) {
            console.error('Failed to toggle source', err);
        }
    };

    const addFeed = async (e) => {
        e.preventDefault();
        if (!newFeed.url || !newFeed.name) return;

        setAdding(true);
        try {
            await apiClient.post('/feed/sources', {
                url: newFeed.url,
                name: newFeed.name,
                category: newFeed.category,
                active: true,
                priority: 5
            });
            setNewFeed({ url: '', name: '', category: 'Custom' });
            setShowAddModal(false);
            loadSources();
        } catch (err) {
            console.error('Failed to add feed', err);
            alert('Failed to add feed. Make sure the RSS URL is valid and not a duplicate.');
        } finally {
            setAdding(false);
        }
    };

    const deleteFeed = async (sourceId, e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this feed source?')) return;

        try {
            await apiClient.delete(`/feed/sources/${sourceId}`);
            loadSources();
        } catch (err) {
            console.error('Failed to delete source', err);
        }
    };

    const categories = ['All', ...Object.keys(sources)];

    const filteredSources = selectedCategory === 'All'
        ? Object.values(sources).flat()
        : sources[selectedCategory] || [];

    const searchFilteredSources = filteredSources.filter(source =>
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        source.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="animate-spin h-8 w-8 text-fuchsia-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-fuchsia-600 to-rose-500 bg-clip-text text-transparent mb-2">
                            Customize Your Feed
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Choose which educational sources you want to see, or add your own!
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-fuchsia-500/30"
                    >
                        <Plus size={20} />
                        Add Feed
                    </button>
                </div>

                {/* Add Feed Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Add Custom RSS Feed
                            </h2>
                            <form onSubmit={addFeed}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Feed Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newFeed.name}
                                            onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                                            placeholder="e.g., My Favorite Science Blog"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            RSS Feed URL
                                        </label>
                                        <input
                                            type="url"
                                            value={newFeed.url}
                                            onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                                            placeholder="https://example.com/rss.xml"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={newFeed.category}
                                            onChange={(e) => setNewFeed({ ...newFeed, category: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                        >
                                            {categoryOptions.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={adding}
                                        className="flex-1 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg font-medium disabled:opacity-50"
                                    >
                                        {adding ? 'Adding...' : 'Add Feed'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search sources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                    />
                </div>

                {/* Category Filter */}
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category
                                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30'
                                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-fuchsia-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Sources Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchFilteredSources.map(source => (
                        <div
                            key={source.id}
                            className={`p-5 rounded-xl border-2 transition-all cursor-pointer group ${source.active
                                ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-gray-300'
                                }`}
                            onClick={() => toggleSource(source.id)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                        {source.name}
                                    </h3>
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                        {source.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => deleteFeed(source.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                        title="Delete feed"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div
                                        className={`flex items-center justify-center w-6 h-6 rounded-full ${source.active
                                            ? 'bg-fuchsia-600'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    >
                                        {source.active ? (
                                            <Check className="text-white" size={16} />
                                        ) : (
                                            <X className="text-white" size={16} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {source.lastFetchedAt && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Last updated: {new Date(source.lastFetchedAt).toLocaleDateString()}
                                </p>
                            )}

                            {source.fetchErrorCount > 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    ⚠️ {source.fetchErrorCount} error{source.fetchErrorCount > 1 ? 's' : ''} - feed may be unavailable
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {searchFilteredSources.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No sources found matching your search.
                    </div>
                )}

                {/* Active Count */}
                <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    {Object.values(sources).flat().filter(s => s.active).length} of{' '}
                    {Object.values(sources).flat().length} sources active
                </div>
            </div>
        </div>
    );
}

