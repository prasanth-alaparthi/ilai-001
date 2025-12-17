import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from "../services/apiClient";
import { useUser } from "../state/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  BookOpen, Clock, TrendingUp, Sparkles, ChevronRight,
  Filter, ArrowUp
} from 'lucide-react';
import Ad from '../components/Ad';

// Show ad after every N posts
const AD_FREQUENCY = 4;

// Topic filter chips
const TopicFilters = ({ selected, onSelect }) => {
  const topics = [
    { id: 'all', name: 'For You', icon: Sparkles },
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'science', name: 'Science', color: 'text-blue-500' },
    { id: 'history', name: 'History', color: 'text-amber-500' },
    { id: 'tech', name: 'Technology', color: 'text-indigo-500' },
    { id: 'art', name: 'Arts', color: 'text-purple-500' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
      {topics.map(topic => {
        const isActive = selected === topic.id;
        return (
          <button
            key={topic.id}
            onClick={() => onSelect(topic.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
              ${isActive
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            {topic.icon && <topic.icon size={14} />}
            {topic.name}
          </button>
        );
      })}
    </div>
  );
};

// Single post card - reading-focused design
const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(post.likedByMe || false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const navigate = useNavigate();

  const toggleLike = async (e) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    try {
      await apiClient.post(`/feed/posts/${post.id}/like`);
    } catch (e) {
      setLiked(!newLiked);
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaved(!saved);
    try {
      await apiClient.post(`/feed/posts/${post.id}/take-note`);
    } catch (e) { console.error(e); }
  };

  const hasImage = post.mediaUrls && post.mediaUrls.length > 0;
  const readTime = Math.max(1, Math.ceil((post.content?.length || 0) / 1000));
  const authorName = post.authorUsername || 'Ilai Education';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-3">
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt={authorName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
              {authorName[0].toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="font-medium text-zinc-900 dark:text-white text-sm">
              {authorName}
            </h4>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Clock size={12} />
              <span>{readTime} min read</span>
              {post.category && (
                <>
                  <span>•</span>
                  <span className="text-indigo-500">{post.category}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <MoreHorizontal size={18} className="text-zinc-400" />
        </button>
      </div>

      {/* Image */}
      {hasImage && (
        <div className="mt-4 mx-4 rounded-xl overflow-hidden">
          <img
            src={post.mediaUrls[0]}
            alt="Post"
            className="w-full h-auto max-h-[400px] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {post.title && (
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2 leading-tight">
            {post.title}
          </h2>
        )}
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[15px]">
          {post.content?.length > 300
            ? `${post.content.substring(0, 300)}...`
            : post.content
          }
        </p>

        {post.content?.length > 300 && (
          <button className="mt-2 text-indigo-500 text-sm font-medium hover:underline flex items-center gap-1">
            Read more <ChevronRight size={14} />
          </button>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${liked
              ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors">
            <MessageCircle size={18} />
            <span className="text-sm font-medium">{post.commentCount || 0}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${saved
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            title="Save to Notes"
          >
            <BookOpen size={18} />
            <span className="text-sm font-medium hidden sm:inline">Take Notes</span>
          </button>

          <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

// Scroll to top button
const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', toggle);
    return () => window.removeEventListener('scroll', toggle);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default function FeedPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const observerTarget = useRef(null);

  useEffect(() => {
    if (user && posts.length === 0) {
      loadFeed(true);
    }
  }, [user]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadFeed(false);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observerTarget.current && observer.unobserve(observerTarget.current);
  }, [hasMore, loading]);

  const loadFeed = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      const res = await apiClient.get(`/feed/posts?page=${currentPage}&size=10`);
      const newPosts = res.data || [];

      setHasMore(newPosts.length >= 10);

      if (reset) {
        setPosts(newPosts);
        setPage(1);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to load feed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-20 pb-16">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          Discover
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Curated knowledge and insights for curious minds
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-2xl mx-auto px-4 mb-6">
        <TopicFilters selected={selectedTopic} onSelect={setSelectedTopic} />
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {posts.map((post, index) => (
          <React.Fragment key={post.id}>
            <PostCard post={post} />
            {/* Show ad after every AD_FREQUENCY posts */}
            {(index + 1) % AD_FREQUENCY === 0 && (
              <Ad type="native" slot="feedNative" />
            )}
          </React.Fragment>
        ))}

        {/* Loading */}
        <div ref={observerTarget} className="py-8 flex justify-center">
          {loading ? (
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
            </div>
          ) : !hasMore && posts.length > 0 ? (
            <p className="text-zinc-400 text-sm">You've caught up on everything!</p>
          ) : posts.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Sparkles size={48} className="mx-auto mb-4 text-zinc-300" />
              <p className="text-zinc-500">No posts yet. Check back later!</p>
            </div>
          ) : null}
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}
