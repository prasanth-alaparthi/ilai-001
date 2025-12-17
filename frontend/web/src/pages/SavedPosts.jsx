import React, { useState, useEffect } from 'react';
import { Bookmark, FolderPlus, Search, Loader2, Grid3X3, List } from 'lucide-react';
import NeuroFeedCard from '../components/feed/NeuroFeedCard';
import feedService from '../services/feedService';

/**
 * SavedPosts - User's bookmarked posts organized in collections
 */
const SavedPosts = () => {
    const [posts, setPosts] = useState([]);
    const [collections, setCollections] = useState(['default']);
    const [activeCollection, setActiveCollection] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSaved();
    }, [activeCollection]);

    const loadSaved = async () => {
        setLoading(true);
        try {
            const collection = activeCollection === 'all' ? null : activeCollection;
            const data = await feedService.getSaved(collection);
            setPosts(data);
        } catch (error) {
            console.error('Load saved error:', error);
            // Mock data
            setPosts(getMockSavedPosts());
            setCollections(['default', 'physics', 'important']);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (postId) => {
        try {
            await feedService.unsavePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Unsave error:', error);
        }
    };

    const filteredPosts = searchQuery
        ? posts.filter(p =>
            p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.hashtags?.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : posts;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Bookmark className="w-8 h-8 text-yellow-400" />
                            Saved Posts
                        </h1>
                        <p className="text-gray-400 mt-1">{posts.length} saved items</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20">
                        <FolderPlus className="w-5 h-5" />
                        New Collection
                    </button>
                </div>

                {/* Search & View Toggle */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search saved posts..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div className="flex bg-white/5 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-3 rounded-lg ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-lg ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}
                        >
                            <Grid3X3 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Collections */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveCollection('all')}
                        className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeCollection === 'all'
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                            }`}
                    >
                        All Saved
                    </button>
                    {collections.map(col => (
                        <button
                            key={col}
                            onClick={() => setActiveCollection(col)}
                            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeCollection === col
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                }`}
                        >
                            {col}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-20">
                        <Bookmark className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No saved posts</h3>
                        <p className="text-gray-400">
                            {searchQuery ? 'No posts match your search' : 'Save posts to access them later'}
                        </p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="space-y-4">
                        {filteredPosts.map(post => (
                            <NeuroFeedCard
                                key={post.id}
                                post={{ ...post, isSaved: true }}
                                onSave={() => handleUnsave(post.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-1">
                        {filteredPosts.map(post => (
                            <div key={post.id} className="aspect-square bg-white/5 relative cursor-pointer overflow-hidden group">
                                {post.mediaUrls?.[0] ? (
                                    <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-4">
                                        <p className="text-gray-400 text-sm text-center line-clamp-4">{post.content}</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Bookmark className="w-8 h-8 text-yellow-400 fill-current" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Mock data
const getMockSavedPosts = () => [
    { id: 1, authorName: 'Dr. Sharma', content: "Newton's 3rd Law explained...", likeCount: 234, commentCount: 18, hashtags: ['physics'], createdAt: new Date().toISOString() },
    { id: 2, authorName: 'Priya Patel', content: 'Quick tip for NEET aspirants...', likeCount: 456, commentCount: 32, hashtags: ['neet', 'tips'], createdAt: new Date().toISOString() },
    { id: 3, authorName: 'Rahul K', content: 'SN1 vs SN2 reactions explained...', likeCount: 67, commentCount: 23, hashtags: ['chemistry'], createdAt: new Date().toISOString() }
];

export default SavedPosts;
