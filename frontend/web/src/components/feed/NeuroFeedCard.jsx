import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, CheckCircle2, Clock, Hash } from 'lucide-react';
import feedService from '../../services/feedService';

/**
 * Professional FeedCard component for NeuroFeed
 * LinkedIn/Medium style with engagement tracking
 * Uses app's existing theme system
 */
const NeuroFeedCard = ({ post, onLike, onSave, onShare, onComment }) => {
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [isSaved, setIsSaved] = useState(post.isSaved || false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [showMenu, setShowMenu] = useState(false);
    const cardRef = useRef(null);
    const viewStartTime = useRef(null);

    // Track view on mount
    useEffect(() => {
        viewStartTime.current = Date.now();
        feedService.trackEngagement(post.id, 'VIEW').catch(() => { });

        return () => {
            // Track time spent when unmounting
            if (viewStartTime.current) {
                const timeSpent = Math.floor((Date.now() - viewStartTime.current) / 1000);
                if (timeSpent > 2) {
                    feedService.trackEngagement(post.id, 'SCROLL', timeSpent, 1.0).catch(() => { });
                }
            }
        };
    }, [post.id]);

    const handleLike = async () => {
        try {
            if (isLiked) {
                await feedService.unlikePost(post.id);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                await feedService.likePost(post.id);
                setLikeCount(prev => prev + 1);
            }
            setIsLiked(!isLiked);
            onLike?.(post.id, !isLiked);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleSave = async () => {
        try {
            if (isSaved) {
                await feedService.unsavePost(post.id);
            } else {
                await feedService.savePost(post.id);
            }
            setIsSaved(!isSaved);
            onSave?.(post.id, !isSaved);
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleShare = () => {
        feedService.trackEngagement(post.id, 'SHARE').catch(() => { });
        onShare?.(post);
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString();
    };

    const getDifficultyBadge = (level) => {
        const colors = {
            BEGINNER: 'bg-green-500/20 text-green-500 dark:text-green-400',
            EASY: 'bg-blue-500/20 text-blue-500 dark:text-blue-400',
            MEDIUM: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
            HARD: 'bg-orange-500/20 text-orange-500 dark:text-orange-400',
            ADVANCED: 'bg-red-500/20 text-red-500 dark:text-red-400'
        };
        return colors[level] || 'bg-secondary/20 text-secondary';
    };

    return (
        <div
            ref={cardRef}
            className="glass-card p-5 mb-4 transition-all duration-300 hover:shadow-lg"
        >
            {/* Header: Author Info */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {post.authorAvatar ? (
                            <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            post.authorName?.charAt(0) || 'A'
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">{post.authorName || 'Anonymous'}</span>
                            {post.authorCredentials && (
                                <CheckCircle2 className="w-4 h-4 text-accent-blue" />
                            )}
                        </div>
                        <div className="text-sm text-secondary flex items-center gap-2">
                            {post.authorCredentials && (
                                <span>{post.authorCredentials}</span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(post.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-surface rounded-full transition-colors"
                    >
                        <MoreHorizontal className="w-5 h-5 text-secondary" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-10 bg-surface border border-border rounded-lg shadow-xl py-2 min-w-[150px] z-10">
                            <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-accent-blue/10">Report</button>
                            <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-accent-blue/10">Not interested</button>
                            <button className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-accent-blue/10">Mute author</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className="text-primary leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Media */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="mb-4 rounded-xl overflow-hidden">
                    {post.mediaUrls.length === 1 ? (
                        <img
                            src={post.mediaUrls[0]}
                            alt=""
                            className="w-full max-h-[400px] object-cover"
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {post.mediaUrls.slice(0, 4).map((url, i) => (
                                <img key={i} src={url} alt="" className="w-full h-48 object-cover rounded-lg" />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.hashtags.map((tag, i) => (
                        <span
                            key={i}
                            className="px-3 py-1 text-sm bg-accent-blue/20 text-accent-blue rounded-full flex items-center gap-1 cursor-pointer hover:bg-accent-blue/30 transition-colors"
                        >
                            <Hash className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Difficulty Badge */}
            {post.difficultyLevel && (
                <div className="mb-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${getDifficultyBadge(post.difficultyLevel)}`}>
                        {post.difficultyLevel}
                    </span>
                </div>
            )}

            {/* Engagement Stats */}
            <div className="flex items-center text-sm text-secondary mb-4 pt-3 border-t border-border">
                <span>{likeCount} likes</span>
                <span className="mx-2">•</span>
                <span>{post.commentCount || 0} comments</span>
                <span className="mx-2">•</span>
                <span>{post.saveCount || 0} saves</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isLiked
                        ? 'text-pink-500 bg-pink-500/10'
                        : 'text-secondary hover:bg-surface hover:text-pink-500'
                        }`}
                >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">Like</span>
                </button>

                <button
                    onClick={() => onComment?.(post)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-secondary hover:bg-surface hover:text-accent-blue transition-all"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">Comment</span>
                </button>

                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isSaved
                        ? 'text-yellow-500 bg-yellow-500/10'
                        : 'text-secondary hover:bg-surface hover:text-yellow-500'
                        }`}
                >
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="font-medium">Save</span>
                </button>

                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-secondary hover:bg-surface hover:text-accent-green transition-all"
                >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Share</span>
                </button>
            </div>
        </div>
    );
};

export default NeuroFeedCard;
