import React, { useState, useEffect } from 'react';
import { useUser } from '../state/UserContext';
import apiClient from '../services/apiClient';
import { FiUser, FiSettings, FiGrid, FiBookmark, FiTag, FiMoreHorizontal } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

const ProfileHeader = ({ user, isOwnProfile, stats, onFollow, isFollowing, navigate }) => (
  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 px-4 md:px-16 py-8 border-b border-slate-200 dark:border-slate-800">
    <div className="flex-shrink-0">
      <div className="w-20 h-20 md:w-36 md:h-36 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
        <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
          <img
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
            alt={user.username}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>
    </div>

    <div className="flex-1 flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <h2 className="text-xl md:text-2xl font-light text-slate-900 dark:text-white">{user.username}</h2>
        {isOwnProfile ? (
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/account')}
              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <FiSettings size={16} /> Settings
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onFollow}
              className={`px-6 py-1.5 rounded-lg text-sm font-semibold ${isFollowing
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold text-slate-900 dark:text-white">
              Message
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center md:justify-start gap-8 md:gap-12 text-slate-900 dark:text-white">
        <div className="text-center md:text-left">
          <span className="font-semibold">{stats.posts}</span> posts
        </div>
        <div className="text-center md:text-left cursor-pointer">
          <span className="font-semibold">{stats.followers}</span> followers
        </div>
        <div className="text-center md:text-left cursor-pointer">
          <span className="font-semibold">{stats.following}</span> following
        </div>
      </div>

      <div className="hidden md:block text-slate-900 dark:text-white">
        <div className="font-semibold">{user.displayName || user.username}</div>
        <div className="whitespace-pre-wrap">{user.bio}</div>
        {user.website && (
          <a href={user.website} target="_blank" rel="noreferrer" className="text-blue-900 dark:text-blue-100 font-semibold">
            {user.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </div>

    {/* Mobile Bio */}
    <div className="md:hidden w-full text-sm text-slate-900 dark:text-white px-2">
      <div className="font-semibold">{user.displayName || user.username}</div>
      <div className="whitespace-pre-wrap">{user.bio}</div>
      {user.website && (
        <a href={user.website} target="_blank" rel="noreferrer" className="text-blue-900 dark:text-blue-100 font-semibold">
          {user.website.replace(/^https?:\/\//, '')}
        </a>
      )}
    </div>
  </div>
);

const ProfileTabs = ({ activeTab, setActiveTab }) => (
  <div className="flex justify-center border-t border-slate-200 dark:border-slate-800">
    <button
      onClick={() => setActiveTab('POSTS')}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-widest uppercase border-t ${activeTab === 'POSTS' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-500'}`}
    >
      <FiGrid size={12} /> Posts
    </button>
    <button
      onClick={() => setActiveTab('SAVED')}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-widest uppercase border-t ${activeTab === 'SAVED' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-500'}`}
    >
      <FiBookmark size={12} /> Saved
    </button>
    <button
      onClick={() => setActiveTab('TAGGED')}
      className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-widest uppercase border-t ${activeTab === 'TAGGED' ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white' : 'border-transparent text-slate-500'}`}
    >
      <FiTag size={12} /> Tagged
    </button>
  </div>
);

const PostGrid = ({ posts }) => (
  <div className="grid grid-cols-3 gap-1 md:gap-8">
    {posts.map(post => (
      <div key={post.id} className="aspect-square relative group cursor-pointer bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          post.mediaType === 'VIDEO' ? (
            <video src={post.mediaUrls[0]} className="w-full h-full object-cover" />
          ) : (
            <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs p-2 text-center">
            {post.content}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center gap-6 text-white font-bold">
          <div className="flex items-center gap-1">
            <span className="text-lg">❤️</span> {post.likeCount}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">💬</span> {post.commentCount}
          </div>
        </div>
      </div>
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

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // 1. Get User Details
      const userRes = await apiClient.get(`/users/username/${username}`);
      const user = userRes.data;
      setProfileUser(user);

      // 2. Get Follow Stats
      const statsRes = await apiClient.get(`/follows/stats/${user.id}`);

      // 3. Get Posts (We need a specific endpoint for user posts, reusing feed service)
      // Assuming we have an endpoint or can filter. For now, let's assume /feed/posts?userId=... or similar
      // Actually, PostController has getFeed which is for current user. 
      // We need a public endpoint for user posts. Let's assume we added it or use existing if adaptable.
      // Wait, PostController.getFeed calls postService.getPostsForUser(userId). 
      // But that endpoint is @GetMapping("/api/feed/posts") which uses Auth token.
      // We need to fetch posts for THIS profile user, not the logged in user.
      // Let's assume we will add /api/feed/posts/user/{userId}

      // Temporary: Mock posts or try to fetch if we added the endpoint. 
      // I'll add the endpoint in the next step.
      const postsRes = await apiClient.get(`/feed/posts/user/${user.id}`);
      setPosts(postsRes.data || []);

      setStats({
        posts: postsRes.data?.length || 0,
        followers: statsRes.data.followers,
        following: statsRes.data.following
      });

      // 4. Check Follow Status
      if (currentUser) {
        const checkRes = await apiClient.get(`/follows/check/${user.id}`);
        setIsFollowing(checkRes.data.isFollowing);
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

  if (loading) return <div className="flex justify-center py-20">Loading...</div>;
  if (!profileUser) return <div className="text-center py-20">User not found</div>;

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="max-w-4xl mx-auto pb-20 bg-white dark:bg-black min-h-screen">
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
        {activeTab === 'POSTS' && <PostGrid posts={posts} />}
        {activeTab === 'SAVED' && (
          <div className="text-center py-20 text-slate-500 text-sm">
            Only you can see what you've saved
          </div>
        )}
        {activeTab === 'TAGGED' && (
          <div className="text-center py-20 text-slate-500 text-sm">
            Photos of you
          </div>
        )}
      </div>
    </div>
  );
}
