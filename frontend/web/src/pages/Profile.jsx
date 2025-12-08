import React, { useState, useEffect } from 'react';
import { useUser } from '../state/UserContext';
import apiClient from '../services/apiClient';
import {
  Settings, Grid, Bookmark, Tag, MoreHorizontal, UserPlus, MessageCircle, Heart
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileHeader = ({ user, isOwnProfile, stats, onFollow, isFollowing, navigate }) => (
  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 px-6 py-10">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex-shrink-0 relative group"
    >
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-accent-glow via-purple-500 to-pink-500">
        <div className="w-full h-full rounded-full bg-background p-1">
          <img
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
            alt={user.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>
    </motion.div>

    <div className="flex-1 flex flex-col gap-6 w-full text-center md:text-left">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <h2 className="text-3xl font-serif text-primary">{user.username}</h2>
        {isOwnProfile ? (
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/account')}
              className="px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-xl text-sm font-medium text-primary transition-colors flex items-center gap-2 border border-black/5 dark:border-white/10"
            >
              <Settings size={16} /> Edit Profile
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={onFollow}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${isFollowing
                ? 'bg-surface-800 text-primary border border-white/10'
                : 'bg-primary text-background hover:bg-primary/90'}`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-xl text-sm font-medium text-primary transition-colors border border-black/5 dark:border-white/10">
              Message
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center md:justify-start gap-10 text-primary">
        <div className="text-center md:text-left">
          <span className="font-bold text-lg block">{stats.posts}</span>
          <span className="text-secondary text-sm">posts</span>
        </div>
        <div className="text-center md:text-left cursor-pointer hover:text-accent-glow transition-colors">
          <span className="font-bold text-lg block">{stats.followers}</span>
          <span className="text-secondary text-sm">followers</span>
        </div>
        <div className="text-center md:text-left cursor-pointer hover:text-accent-glow transition-colors">
          <span className="font-bold text-lg block">{stats.following}</span>
          <span className="text-secondary text-sm">following</span>
        </div>
      </div>

      <div className="text-primary max-w-md">
        <div className="font-bold mb-1">{user.displayName || user.username}</div>
        <div className="whitespace-pre-wrap text-secondary/80 text-sm leading-relaxed mb-2">{user.bio}</div>
        {user.website && (
          <a href={user.website} target="_blank" rel="noreferrer" className="text-accent-glow hover:text-accent-glow/80 text-sm font-medium flex items-center gap-1 justify-center md:justify-start">
            {user.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </div>
  </div>
);

const ProfileTabs = ({ activeTab, setActiveTab }) => (
  <div className="flex justify-center border-t border-white/10 mb-4">
    {['POSTS', 'SAVED', 'TAGGED'].map((tab) => {
      const icons = { POSTS: Grid, SAVED: Bookmark, TAGGED: Tag };
      const Icon = icons[tab];
      const isActive = activeTab === tab;
      return (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`relative flex items-center gap-2 px-8 py-4 text-xs font-bold tracking-widest uppercase transition-colors ${isActive ? 'text-primary' : 'text-secondary hover:text-primary'}`}
        >
          {isActive && (
            <motion.div layoutId="activeTab" className="absolute top-0 left-0 right-0 h-[1px] bg-primary" />
          )}
          <Icon size={12} /> {tab}
        </button>
      )
    })}
  </div>
);

const PostGrid = ({ posts }) => (
  <div className="grid grid-cols-3 gap-1 md:gap-8">
    {posts.map((post, idx) => (
      <motion.div
        key={post.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: idx * 0.05 }}
        className="aspect-square relative group cursor-pointer bg-surface-800 overflow-hidden rounded-md md:rounded-xl"
      >
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          post.mediaType === 'VIDEO' ? (
            <video src={post.mediaUrls[0]} className="w-full h-full object-cover" />
          ) : (
            <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center">
            <p className="text-xs md:text-sm text-secondary line-clamp-4 font-serif italic">"{post.content}"</p>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold backdrop-blur-[2px]">
          <div className="flex items-center gap-2">
            <Heart className="fill-white" size={20} /> {post.likeCount}
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="fill-white" /> {post.commentCount}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useUser();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('POSTS');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userRes = await apiClient.get(`/users/username/${username}`);
      const user = userRes.data;
      setProfileUser(user);

      try {
        const statsRes = await apiClient.get(`/follows/stats/${user.id}`);
        setStats(prev => ({ ...prev, followers: statsRes.data.followers, following: statsRes.data.following }));
      } catch (e) { console.warn("Stats fetch error", e); }

      try {
        const postsRes = await apiClient.get(`/feed/posts/user/${user.id}`);
        setPosts(postsRes.data || []);
        setStats(prev => ({ ...prev, posts: postsRes.data?.length || 0 }));
      } catch (e) {
        console.warn("User posts fetch error", e);
        setPosts([]);
      }

      if (currentUser) {
        try {
          const checkRes = await apiClient.get(`/follows/check/${user.id}`);
          setIsFollowing(checkRes.data.isFollowing);
        } catch (e) { }
      }

    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    try {
      if (isFollowing) {
        await apiClient.delete(`/follows/${profileUser.id}`);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await apiClient.post(`/follows/${profileUser.id}`);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
      setIsFollowing(!isFollowing);
    } catch (e) {
      console.error("Follow action failed", e);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-secondary animate-pulse">Loading profile...</div>;
  if (!profileUser) return <div className="flex h-screen items-center justify-center text-secondary">User not found</div>;

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="min-h-screen bg-background text-primary pb-20">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader
          user={profileUser}
          isOwnProfile={isOwnProfile}
          stats={stats}
          onFollow={handleFollow}
          isFollowing={isFollowing}
          navigate={navigate}
        />

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="px-4 md:px-0">
          <AnimatePresence mode="wait">
            {activeTab === 'POSTS' && (
              <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PostGrid posts={posts} />
              </motion.div>
            )}
            {activeTab === 'SAVED' && (
              <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-secondary/50">
                <Bookmark size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Save photos and videos that you want to see again.</p>
              </motion.div>
            )}
            {activeTab === 'TAGGED' && (
              <motion.div key="tagged" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-secondary/50">
                <Tag size={48} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Photos of you will appear here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
