import React, { useState, useEffect, useRef } from 'react';
import apiClient from "../services/apiClient";
import { useUser } from "../state/UserContext";
import {
  Home, PlusSquare, User, Heart, MessageCircle,
  Send, Bookmark, MoreHorizontal, Search, Bell,
  BookOpen, Lightbulb, Image as ImageIcon, X
} from 'lucide-react';

// --- Components ---

// --- Components ---

const NavBar = ({ currentView, setView }) => (
  <div className="fixed bottom-6 right-0 left-0 md:left-[var(--sidebar-width)] flex justify-center z-50 pointer-events-none transition-[left] duration-300">
    <nav className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-2xl rounded-full px-8 py-3 flex items-center gap-8 border border-gray-200 dark:border-slate-700 pointer-events-auto">
      <button
        onClick={() => setView('explore')}
        className={`p-2 transition-all hover:scale-110 ${currentView === 'explore' ? 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/30 rounded-full' : 'text-gray-500 dark:text-gray-400'}`}
        title="Explore"
      >
        <Search size={24} strokeWidth={currentView === 'explore' ? 2.5 : 2} />
      </button>
      <button
        onClick={() => setView('new_post')}
        className={`p-2 transition-all hover:scale-110 ${currentView === 'new_post' ? 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/30 rounded-full' : 'text-gray-500 dark:text-gray-400'}`}
        title="New Post"
      >
        <PlusSquare size={24} strokeWidth={currentView === 'new_post' ? 2.5 : 2} />
      </button>
      <button
        onClick={() => setView('profile')}
        className={`p-2 transition-all hover:scale-110 ${currentView === 'profile' ? 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/30 rounded-full' : 'text-gray-500 dark:text-gray-400'}`}
        title="Profile"
      >
        <User size={24} strokeWidth={currentView === 'profile' ? 2.5 : 2} />
      </button>
    </nav>
  </div>
);

const StoriesBar = () => {
  const stories = [
    { id: 1, name: 'Science', color: 'from-blue-500 to-cyan-500' },
    { id: 2, name: 'History', color: 'from-amber-500 to-orange-500' },
    { id: 3, name: 'Art', color: 'from-purple-500 to-pink-500' },
    { id: 4, name: 'Math', color: 'from-green-500 to-emerald-500' },
    { id: 5, name: 'Space', color: 'from-indigo-500 to-violet-500' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 scrollbar-hide">
      <div className="flex flex-col items-center gap-1 min-w-[70px]">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-gray-300 flex items-center justify-center relative">
          <PlusSquare className="text-gray-400" />
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white dark:border-slate-900">
            <PlusSquare size={12} fill="currentColor" />
          </div>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">My Study</span>
      </div>

      {stories.map(story => (
        <div key={story.id} className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer">
          <div className={`w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr ${story.color}`}>
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 p-[2px]">
              <div className="w-full h-full rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                <span className="text-[10px] font-bold text-gray-500">{story.name}</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{story.name}</span>
        </div>
      ))}
    </div>
  );
};

const PostCard = ({ post, currentUserId }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageError, setImageError] = useState(false);

  const toggleLike = async () => {
    setLiked(!liked);
    try {
      await apiClient.post(`/feed/posts/${post.id}/like`);
    } catch (e) {
      console.error("Like failed", e);
    }
  };

  const handleTakeNote = async () => {
    try {
      await apiClient.post(`/feed/posts/${post.id}/take-note`);
      alert("Note created from post!");
    } catch (e) {
      console.error("Take note failed", e);
      alert("Failed to create note.");
    }
  };

  const handleExplain = async () => {
    try {
      await apiClient.post(`/feed/posts/${post.id}/elaborate`);
      alert("AI Explanation requested! Check your notes shortly.");
    } catch (e) {
      console.error("Explain failed", e);
      alert("Failed to request explanation.");
    }
  };

  const hasImage = post.mediaUrls && post.mediaUrls.length > 0 && !imageError;

  return (
    <div className="bg-white dark:bg-slate-900 mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white border border-gray-100 overflow-hidden">
            <img src="/ilai-logo-feminine-v2.png" alt="Ilai" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white block">
              Ilai
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {post.location || 'Educational Feed'} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <button className="text-gray-500 dark:text-gray-400">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content Area - Image or Text */}
      {hasImage ? (
        <div className="w-full aspect-square bg-gray-100 dark:bg-slate-800 overflow-hidden relative">
          <img
            src={post.mediaUrls[0]}
            alt="Post"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="px-4 py-6 bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 min-h-[200px] flex items-center justify-center text-center">
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      {/* Action Bar */}
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={toggleLike} className={`transition-transform active:scale-125 ${liked ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            <Heart size={26} fill={liked ? "currentColor" : "none"} />
          </button>
          <button onClick={handleExplain} className="text-gray-900 dark:text-white hover:text-fuchsia-500" title="Explain with AI">
            <Lightbulb size={26} />
          </button>
          <button onClick={handleTakeNote} className="text-gray-900 dark:text-white hover:text-fuchsia-500" title="Take Note">
            <BookOpen size={26} />
          </button>
        </div>
        <button onClick={() => setSaved(!saved)} className={`${saved ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
          <Bookmark size={26} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Likes & Caption */}
      <div className="px-4 space-y-2">
        <div className="font-semibold text-sm text-gray-900 dark:text-white">
          {post.likeCount || 0} likes
        </div>

        {hasImage && (
          <div className="text-sm text-gray-900 dark:text-white">
            <span className="font-semibold mr-2">Ilai</span>
            {post.content}
          </div>
        )}

        {post.tags && (
          <div className="flex flex-wrap gap-1 mt-1">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-blue-600 dark:text-blue-400">#{tag}</span>
            ))}
          </div>
        )}

        {/* Source URL Display */}
        {post.sourceUrl && (
          <div className="mt-2">
            <a
              href={post.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Source: {new URL(post.sourceUrl).hostname.replace('www.', '')}
            </a>
          </div>
        )}

        <button className="text-gray-500 dark:text-gray-400 text-sm">
          View all {post.commentCount || 0} comments
        </button>
      </div>
    </div>
  );
};

// --- Views ---

const FeedView = ({ posts, currentUserId, loading, hasMore, onLoadMore }) => {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="pb-24 pt-2 max-w-md mx-auto bg-white dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 mb-2 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-40">
        <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
          Muse Feed
        </h1>
        <div className="flex gap-4">
          <button className="text-gray-900 dark:text-white relative">
            <Heart size={24} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="text-gray-900 dark:text-white relative">
            <MessageCircle size={24} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
          </button>
        </div>
      </div>

      <StoriesBar />

      <div className="h-px bg-gray-100 dark:bg-slate-800 mb-2"></div>

      <div>
        {posts.map(post => (
          <PostCard key={post.id} post={post} currentUserId={currentUserId} />
        ))}
      </div>

      <div ref={observerTarget} className="h-20 flex justify-center items-center">
        {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>}
        {!hasMore && posts.length > 0 && <span className="text-gray-500 text-sm">No more posts</span>}
      </div>
    </div>
  );
};

// ... ExploreView, NewPostView, ProfileView ...

// --- Main App Component ---

export default function StudySphere() {
  const { user } = useUser();
  const [view, setView] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const qParam = params.get('q');

    if (viewParam) {
      setView(viewParam);
    }
    if (qParam) {
      setInitialQuery(qParam);
    }
  }, []);

  useEffect(() => {
    if (user && view === 'feed' && posts.length === 0) {
      loadFeed(true);
    }
  }, [user, view]);

  const loadFeed = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentPage = reset ? 0 : page;
      const res = await apiClient.get(`/feed/posts?page=${currentPage}&size=10`);
      const newPosts = res.data || [];

      if (newPosts.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

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
    <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-gray-900 dark:text-white">
      {view === 'feed' && (
        <FeedView
          posts={posts}
          currentUserId={user.id}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => loadFeed(false)}
        />
      )}
      {view === 'explore' && <ExploreView currentUserId={user.id} initialQuery={initialQuery} />}
      {view === 'new_post' && <NewPostView onPostCreated={() => loadFeed(true)} setView={setView} />}
      {view === 'profile' && <ProfileView user={user} />}

      <NavBar currentView={view} setView={setView} />
    </div>
  );
}
