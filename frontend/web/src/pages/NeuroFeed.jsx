import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, TrendingUp, Users, Bookmark, Hash, Sparkles, Loader2, Search } from 'lucide-react';
import NeuroFeedCard from '../components/feed/NeuroFeedCard';
import CreatePostModal from '../components/feed/CreatePostModal';
import feedService from '../services/feedService';

/**
 * NeuroFeed Page - Personalized learning feed with AI algorithm
 * Uses app's existing theme system
 */
const NeuroFeed = () => {
    const [activeTab, setActiveTab] = useState('for-you');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [trendingHashtags, setTrendingHashtags] = useState([]);
    const [selectedHashtag, setSelectedHashtag] = useState(null);
    const observerRef = useRef(null);
    const offset = useRef(0);

    const tabs = [
        { id: 'for-you', label: 'For You', icon: Sparkles },
        { id: 'trending', label: 'Trending', icon: TrendingUp },
        { id: 'following', label: 'Following', icon: Users },
        { id: 'saved', label: 'Saved', icon: Bookmark }
    ];

    // Load feed based on active tab
    const loadFeed = useCallback(async (reset = false) => {
        if (reset) {
            offset.current = 0;
            setHasMore(true);
        }

        try {
            setLoading(reset);
            setLoadingMore(!reset && offset.current > 0);

            let newPosts = [];

            if (selectedHashtag) {
                newPosts = await feedService.getByHashtag(selectedHashtag, 20);
            } else {
                switch (activeTab) {
                    case 'for-you':
                        newPosts = await feedService.getFeed(20, offset.current);
                        break;
                    case 'trending':
                        newPosts = await feedService.getTrending(20);
                        break;
                    case 'following':
                        newPosts = await feedService.getFollowingFeed(20);
                        break;
                    case 'saved':
                        newPosts = await feedService.getSaved();
                        break;
                    default:
                        newPosts = await feedService.getFeed(20, offset.current);
                }
            }

            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            setHasMore(newPosts.length >= 20);
            offset.current += newPosts.length;
        } catch (error) {
            console.error('Feed load error:', error);
            // Show mock data for development
            if (reset) {
                setPosts(getMockPosts());
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeTab, selectedHashtag]);

    // Load trending hashtags
    useEffect(() => {
        const loadTrending = async () => {
            try {
                const trends = await feedService.getTrendingHashtags(10);
                setTrendingHashtags(trends);
            } catch (error) {
                // Mock trending for development
                setTrendingHashtags([
                    { hashtag: 'physics', count: 1234 },
                    { hashtag: 'calculus', count: 890 },
                    { hashtag: 'chemistry', count: 756 },
                    { hashtag: 'jee2025', count: 543 },
                    { hashtag: 'neet', count: 432 }
                ]);
            }
        };
        loadTrending();
    }, []);

    // Reload on tab change
    useEffect(() => {
        setSelectedHashtag(null);
        loadFeed(true);
    }, [activeTab]);

    // Reload on hashtag change
    useEffect(() => {
        if (selectedHashtag !== null) {
            loadFeed(true);
        }
    }, [selectedHashtag]);

    // Infinite scroll observer
    const lastPostRef = useCallback(
        (node) => {
            if (loadingMore) return;
            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore && activeTab === 'for-you') {
                    loadFeed(false);
                }
            });

            if (node) observerRef.current.observe(node);
        },
        [loadingMore, hasMore, activeTab, loadFeed]
    );

    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Main Feed Column */}
                    <div className="flex-1 max-w-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-accent-blue" />
                                NeuroFeed
                            </h1>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Create Post
                            </button>
                        </div>

                        {/* Selected Hashtag Banner */}
                        {selectedHashtag && (
                            <div className="mb-4 p-4 bg-accent-blue/20 border border-accent-blue/30 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Hash className="w-5 h-5 text-accent-blue" />
                                    <span className="text-primary font-medium">#{selectedHashtag}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedHashtag(null)}
                                    className="text-sm text-secondary hover:text-primary"
                                >
                                    Clear filter
                                </button>
                            </div>
                        )}

                        {/* Tab Navigation */}
                        <div className="flex gap-1 mb-6 bg-surface border border-border p-1 rounded-xl">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-accent-blue text-white shadow-lg'
                                        : 'text-secondary hover:text-primary hover:bg-surface'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-accent-blue animate-spin mb-4" />
                                <p className="text-secondary">Loading your personalized feed...</p>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 mx-auto mb-4 bg-accent-blue/20 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-accent-blue" />
                                </div>
                                <h3 className="text-xl font-semibold text-primary mb-2">No posts yet</h3>
                                <p className="text-secondary mb-6">
                                    Be the first to share something with the community!
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 bg-accent-blue text-white rounded-xl font-medium"
                                >
                                    Create your first post
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Feed Posts */}
                                {posts.map((post, index) => (
                                    <div
                                        key={post.id}
                                        ref={index === posts.length - 1 ? lastPostRef : null}
                                    >
                                        <NeuroFeedCard
                                            post={post}
                                            onComment={(p) => console.log('Comment on:', p)}
                                            onShare={(p) => console.log('Share:', p)}
                                        />
                                    </div>
                                ))}

                                {/* Loading More */}
                                {loadingMore && (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="hidden lg:block w-80">
                        {/* Trending Hashtags */}
                        <div className="glass-card p-4 mb-6">
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-accent-blue" />
                                Trending Topics
                            </h3>
                            <div className="space-y-2">
                                {trendingHashtags.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedHashtag(item.hashtag)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedHashtag === item.hashtag
                                            ? 'bg-accent-blue/20 border border-accent-blue'
                                            : 'hover:bg-surface'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-accent-blue" />
                                            <span className="text-primary">{item.hashtag}</span>
                                        </span>
                                        <span className="text-sm text-secondary">{item.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-card p-4">
                            <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface text-secondary transition-all">
                                    <Search className="w-5 h-5" />
                                    <span>Search posts</span>
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface text-secondary transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Create post</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onPostCreated={handlePostCreated}
            />
        </div>
    );
};

// Mock posts for development
const getMockPosts = () => [
    {
        id: 1,
        authorName: 'Dr. Sharma',
        authorCredentials: 'IIT Delhi • Physics',
        authorAvatar: null,
        content: "Newton's 3rd Law explained simply: For every action, there's an equal and opposite reaction. Think of it like a skateboard - when you push backward, you move forward! 🛹\n\nThis is the fundamental principle behind rocket propulsion, car engines, and why you can walk on the ground.",
        hashtags: ['physics', 'newtonslaws', 'jee'],
        mediaUrls: [],
        contentType: 'INSIGHT',
        difficultyLevel: 'BEGINNER',
        likeCount: 234,
        commentCount: 18,
        saveCount: 45,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isLiked: false,
        isSaved: false
    },
    {
        id: 2,
        authorName: 'Priya Patel',
        authorCredentials: 'AIIMS • MBBS 2024',
        authorAvatar: null,
        content: "Quick tip for NEET aspirants: Always read the question twice before answering. 90% of silly mistakes happen because we rush through the question.\n\nI used to lose 15-20 marks per paper due to this. Now I practice actively reading each word. Try it!",
        hashtags: ['neet', 'studytips', 'medicine'],
        mediaUrls: [],
        contentType: 'INSIGHT',
        difficultyLevel: 'EASY',
        likeCount: 456,
        commentCount: 32,
        saveCount: 89,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        isLiked: true,
        isSaved: false
    },
    {
        id: 3,
        authorName: 'Rahul K',
        authorCredentials: 'JEE AIR 123',
        authorAvatar: null,
        content: "Doubt: Can someone explain the difference between SN1 and SN2 reactions? I always get confused about when each mechanism applies.\n\nSpecifically:\n1. How do you determine which one occurs?\n2. What role does the solvent play?\n3. Why is SN2 faster for primary carbons?",
        hashtags: ['chemistry', 'organicchemistry', 'jee', 'doubt'],
        mediaUrls: [],
        contentType: 'QUESTION',
        difficultyLevel: 'MEDIUM',
        likeCount: 67,
        commentCount: 23,
        saveCount: 12,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        isLiked: false,
        isSaved: true
    }
];

export default NeuroFeed;
