import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from "../services/apiClient";
import { useUser } from "../state/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  Search, BookOpen, Lightbulb, Image as ImageIcon, Filter,
  ArrowUpRight, Grid, Layout
} from 'lucide-react';

const StoriesBar = () => {
  const topics = [
    { id: 1, name: 'Science', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { id: 2, name: 'History', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { id: 3, name: 'Art', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { id: 4, name: 'Math', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { id: 5, name: 'Tech', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-6 pt-2 px-8 md:justify-center scrollbar-hide mask-linear-fade">
      <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface text-primary border border-border text-sm font-medium hover:bg-zinc-200 transition-colors whitespace-nowrap">
        <Filter size={14} /> For You
      </button>
      {topics.map(topic => (
        <button
          key={topic.id}
          className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all hover:scale-105 whitespace-nowrap ${topic.color}`}
        >
          {topic.name}
        </button>
      ))}
    </div>
  );
};

const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  const toggleLike = async (e) => {
    e.stopPropagation();
    setLiked(!liked);
    try {
      await apiClient.post(`/feed/posts/${post.id}/like`);
    } catch (e) { console.error(e); }
  };

  const handleTakeNote = async (e) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/feed/posts/${post.id}/take-note`);
      // Could show a toast here
    } catch (e) { console.error(e); }
  };

  const hasImage = post.mediaUrls && post.mediaUrls.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="mb-6 break-inside-avoid relative group"
    >
      <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-black/10 dark:border-white/10 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ease-out dark:hover:border-primary/30 transform hover:-translate-y-1">

        {/* Content */}
        {hasImage ? (
          <div className="relative">
            <img
              src={post.mediaUrls[0]}
              alt="Post"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            {/* Overlay Gradient on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4`}>
              <div className="flex justify-between items-end translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="text-white">
                  <p className="font-medium text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/70">
                    <span>@{post.username || 'Ilai'}</span>
                    <span>•</span>
                    <span>{post.likeCount || 0} likes</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={toggleLike} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors">
                    <Heart size={18} fill={liked ? "currentColor" : "none"} className={liked ? "text-red-500" : ""} />
                  </button>
                  <button onClick={handleTakeNote} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors">
                    <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 min-h-[180px] flex flex-col justify-between relative bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-secondary hover:text-primary"><MoreHorizontal size={18} /></button>
            </div>

            <div>
              <p className="text-base text-primary font-medium leading-relaxed font-serif">
                {post.content}
              </p>
              {post.tags && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs text-secondary/60">#{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-secondary">
                <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span>Ilai</span>
              </div>
              <div className="flex gap-3 text-secondary">
                <button onClick={toggleLike} className={`hover:text-red-500 transition-colors ${liked ? 'text-red-500' : ''}`}><Heart size={16} fill={liked ? "currentColor" : "none"} /></button>
                <button onClick={handleTakeNote} className="hover:text-primary transition-colors"><BookOpen size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FeedView = ({ posts, loading, hasMore, onLoadMore }) => {
  const observerTarget = useRef(null);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observerTarget.current && observer.unobserve(observerTarget.current);
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-12 px-4 md:px-8">
      {/* Header Area */}
      <div className="max-w-7xl mx-auto mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 tracking-tight">Discover</h1>
        <p className="text-secondary max-w-lg mx-auto text-lg font-light">
          Explore curated knowledge, visual inspiration, and community insights.
        </p>
      </div>

      <StoriesBar />

      <div className="max-w-7xl mx-auto mt-8">
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Loading / End States */}
        <div ref={observerTarget} className="py-12 flex justify-center w-full">
          {loading ? (
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
            </div>
          ) : !hasMore && posts.length > 0 ? (
            <div className="text-center">
              <p className="text-secondary text-sm font-light italic">You've reached the end of the void.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default function StudySphere() {
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user && posts.length === 0) {
      loadFeed(true);
    }
  }, [user]);

  const loadFeed = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      const res = await apiClient.get(`/feed/posts?page=${currentPage}&size=15`); // Increased size for masonry
      const newPosts = res.data || [];

      if (newPosts.length < 15) setHasMore(false);
      else setHasMore(true);

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
    <FeedView
      posts={posts}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={() => loadFeed(false)}
    />
  );
}
