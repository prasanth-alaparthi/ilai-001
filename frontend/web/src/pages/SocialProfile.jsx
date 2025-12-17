import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Settings, Grid3X3, Bookmark, Users, Heart, MessageCircle,
    Share2, MoreHorizontal, Loader2, MapPin, Link as LinkIcon,
    Award, ArrowLeft
} from 'lucide-react';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import EditProfileModal from '../components/profile/EditProfileModal';
import NeuroFeedCard from '../components/feed/NeuroFeedCard';
import GroupCard from '../components/groups/GroupCard';
import PeopleList from '../components/social/PeopleList';
import socialService from '../services/socialService';
import feedService from '../services/feedService';
import groupService from '../services/groupService';

/**
 * SocialProfile - Instagram-style profile page
 * Uses app's existing theme system
 */
const SocialProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);

    // Check if viewing own profile
    const currentUserId = localStorage.getItem('userId') || 'current';
    const isOwnProfile = !userId || userId === currentUserId;

    useEffect(() => {
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const targetUserId = userId || currentUserId;
            const profileData = await socialService.getProfile(targetUserId);
            setProfile(profileData);

            // Load posts
            if (isOwnProfile) {
                const [postsData, savedData, groupsData] = await Promise.all([
                    feedService.getFeed(50, 0),
                    feedService.getSaved(),
                    groupService.getMyGroups()
                ]);
                setPosts(postsData.filter(p => String(p.userId) === targetUserId));
                setSavedPosts(savedData);
                setGroups(groupsData);
            } else {
                const postsData = await feedService.getFeed(50, 0);
                setPosts(postsData.filter(p => String(p.userId) === targetUserId));
            }
        } catch (error) {
            console.error('Load profile error:', error);
            // Mock data for development
            setProfile(getMockProfile(isOwnProfile));
            setPosts(getMockPosts());
            setSavedPosts(getMockPosts().slice(0, 2));
            setGroups(getMockGroups());
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (isFollowing) => {
        setProfile(prev => ({
            ...prev,
            isFollowing,
            followerCount: prev.followerCount + (isFollowing ? 1 : -1)
        }));
    };

    const loadFollowers = async () => {
        try {
            const data = await socialService.getFollowers();
            setFollowers(data);
            setShowFollowers(true);
        } catch (error) {
            setFollowers(getMockFollowers());
            setShowFollowers(true);
        }
    };

    const loadFollowing = async () => {
        try {
            const data = await socialService.getFollowing();
            setFollowing(data);
            setShowFollowing(true);
        } catch (error) {
            setFollowing(getMockFollowers());
            setShowFollowing(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent-blue animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Back Button (when viewing other profile) */}
                {!isOwnProfile && (
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-secondary hover:text-primary mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                )}

                {/* Profile Header */}
                <div className="glass-card overflow-hidden mb-6">
                    {/* Cover Image */}
                    <div className="h-48 bg-gradient-to-r from-accent-blue to-accent-green relative">
                        {profile?.coverImageUrl && (
                            <img src={profile.coverImageUrl} alt="" className="w-full h-full object-cover" />
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="px-6 pb-6">
                        {/* Avatar & Actions Row */}
                        <div className="flex items-end justify-between -mt-16 mb-4">
                            {/* Avatar */}
                            <div className="w-32 h-32 rounded-full border-4 border-background bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center overflow-hidden shadow-xl">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold text-4xl">
                                        {profile?.displayName?.charAt(0) || '?'}
                                    </span>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mb-4">
                                {isOwnProfile ? (
                                    <>
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="px-6 py-2 bg-surface border border-border text-primary font-medium rounded-xl hover:bg-accent-blue/10 transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                        <button className="p-2 bg-surface border border-border rounded-xl hover:bg-accent-blue/10">
                                            <Settings className="w-5 h-5 text-primary" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleFollow(!profile?.isFollowing)}
                                            className={`px-6 py-2 font-medium rounded-xl transition-colors ${profile?.isFollowing
                                                ? 'bg-surface border border-border text-primary hover:border-red-500 hover:text-red-500'
                                                : 'bg-accent-blue text-white hover:opacity-90'
                                                }`}
                                        >
                                            {profile?.isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                        <button className="px-6 py-2 bg-surface border border-border text-primary font-medium rounded-xl hover:bg-accent-blue/10">
                                            Message
                                        </button>
                                        <button className="p-2 bg-surface border border-border rounded-xl hover:bg-accent-blue/10">
                                            <MoreHorizontal className="w-5 h-5 text-primary" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Name & Credentials */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-primary">{profile?.displayName}</h1>
                                {profile?.isVerified && (
                                    <Award className="w-6 h-6 text-accent-blue" />
                                )}
                            </div>
                            {profile?.credentials && (
                                <p className="text-accent-blue font-medium">{profile.credentials}</p>
                            )}
                        </div>

                        {/* Bio */}
                        {profile?.bio && (
                            <p className="text-secondary mb-4 whitespace-pre-wrap">{profile.bio}</p>
                        )}

                        {/* Meta Info */}
                        {(profile?.institution || profile?.educationLevel) && (
                            <div className="flex flex-wrap gap-4 text-sm text-secondary mb-4">
                                {profile.institution && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.institution}
                                    </span>
                                )}
                                {profile.educationLevel && (
                                    <span>{profile.educationLevel} {profile.graduationYear && `• ${profile.graduationYear}`}</span>
                                )}
                            </div>
                        )}

                        {/* Stats - Instagram Style */}
                        <div className="flex gap-8 py-4 border-t border-b border-border">
                            <div className="text-center">
                                <div className="text-xl font-bold text-primary">{profile?.postCount || posts.length}</div>
                                <div className="text-sm text-secondary">posts</div>
                            </div>
                            <button onClick={loadFollowers} className="text-center hover:opacity-80">
                                <div className="text-xl font-bold text-primary">{profile?.followerCount || 0}</div>
                                <div className="text-sm text-secondary">followers</div>
                            </button>
                            <button onClick={loadFollowing} className="text-center hover:opacity-80">
                                <div className="text-xl font-bold text-primary">{profile?.followingCount || 0}</div>
                                <div className="text-sm text-secondary">following</div>
                            </button>
                            {isOwnProfile && (
                                <div className="text-center">
                                    <div className="text-xl font-bold text-primary">{profile?.friendCount || 0}</div>
                                    <div className="text-sm text-secondary">friends</div>
                                </div>
                            )}
                        </div>

                        {/* Subjects */}
                        {profile?.subjects && profile.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {profile.subjects.map((subject, i) => (
                                    <span key={i} className="px-3 py-1 bg-accent-blue/20 text-accent-blue rounded-full text-sm">
                                        {subject}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'posts' ? 'bg-accent-blue text-white' : 'text-secondary hover:text-primary'
                            }`}
                    >
                        <Grid3X3 className="w-4 h-4" />
                        Posts
                    </button>
                    {isOwnProfile && (
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'saved' ? 'bg-accent-blue text-white' : 'text-secondary hover:text-primary'
                                }`}
                        >
                            <Bookmark className="w-4 h-4" />
                            Saved
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'groups' ? 'bg-accent-blue text-white' : 'text-secondary hover:text-primary'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Groups
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'posts' && (
                    <>
                        {/* View Mode Toggle */}
                        <div className="flex justify-end mb-4">
                            <div className="flex bg-surface border border-border rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-accent-blue text-white' : 'text-secondary'}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-accent-blue text-white' : 'text-secondary'}`}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Grid View - Instagram Style */}
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-3 gap-1">
                                {posts.map((post) => (
                                    <PostGridItem key={post.id} post={post} />
                                ))}
                                {posts.length === 0 && (
                                    <div className="col-span-3 text-center py-20 text-secondary">
                                        No posts yet
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {posts.map((post) => (
                                    <NeuroFeedCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'saved' && isOwnProfile && (
                    <div className="grid grid-cols-3 gap-1">
                        {savedPosts.map((post) => (
                            <PostGridItem key={post.id} post={post} />
                        ))}
                        {savedPosts.length === 0 && (
                            <div className="col-span-3 text-center py-20 text-secondary">
                                No saved posts
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div className="grid grid-cols-2 gap-4">
                        {groups.map((group) => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                        {groups.length === 0 && (
                            <div className="col-span-2 text-center py-20 text-secondary">
                                Not a member of any groups
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                profile={profile}
                onProfileUpdated={(updated) => setProfile(updated)}
            />

            {/* Followers Modal */}
            {showFollowers && (
                <FollowersModal
                    title="Followers"
                    users={followers}
                    onClose={() => setShowFollowers(false)}
                />
            )}

            {/* Following Modal */}
            {showFollowing && (
                <FollowersModal
                    title="Following"
                    users={following}
                    onClose={() => setShowFollowing(false)}
                />
            )}
        </div>
    );
};

// Instagram-style post grid item
const PostGridItem = ({ post }) => {
    const [showOverlay, setShowOverlay] = useState(false);

    return (
        <div
            className="aspect-square bg-surface relative cursor-pointer overflow-hidden"
            onMouseEnter={() => setShowOverlay(true)}
            onMouseLeave={() => setShowOverlay(false)}
        >
            {post.mediaUrls?.[0] ? (
                <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                    <p className="text-secondary text-sm text-center line-clamp-4">{post.content}</p>
                </div>
            )}

            {/* Hover Overlay */}
            {showOverlay && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-6">
                    <span className="flex items-center gap-1 text-white font-bold">
                        <Heart className="w-5 h-5 fill-current" />
                        {post.likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1 text-white font-bold">
                        <MessageCircle className="w-5 h-5 fill-current" />
                        {post.commentCount || 0}
                    </span>
                </div>
            )}
        </div>
    );
};

// Followers/Following Modal
const FollowersModal = ({ title, users, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-surface border border-border rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                <button onClick={onClose} className="text-secondary hover:text-primary text-2xl">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
                <PeopleList users={users} />
            </div>
        </div>
    </div>
);

// Mock data
const getMockProfile = (isOwn) => ({
    userId: 'user1',
    displayName: isOwn ? 'Your Name' : 'Arjun Kumar',
    bio: "IIT Bombay CS '25 | Building cool stuff with AI\nPassionate about Physics & Coding",
    credentials: 'IIT Bombay • Computer Science',
    avatarUrl: null,
    coverImageUrl: null,
    institution: 'IIT Bombay',
    educationLevel: 'Undergraduate',
    graduationYear: 2025,
    subjects: ['Physics', 'Mathematics', 'Computer Science'],
    followerCount: 1234,
    followingCount: 567,
    friendCount: 89,
    postCount: 42,
    isVerified: true,
    isFollowing: false
});

const getMockPosts = () => [
    { id: 1, content: "Just solved a complex DP problem!", likeCount: 45, commentCount: 12, mediaUrls: [], createdAt: new Date().toISOString() },
    { id: 2, content: "Physics is beautiful ✨", likeCount: 89, commentCount: 24, mediaUrls: [], createdAt: new Date().toISOString() },
    { id: 3, content: "New project coming soon!", likeCount: 156, commentCount: 34, mediaUrls: [], createdAt: new Date().toISOString() },
];

const getMockGroups = () => [
    { id: 'g1', name: 'JEE Physics', memberCount: 1234, hashtags: ['physics'], visibility: 'PUBLIC', isMember: true },
    { id: 'g2', name: 'Coding Club', memberCount: 567, hashtags: ['coding'], visibility: 'PUBLIC', isMember: true }
];

const getMockFollowers = () => [
    { userId: 'u1', displayName: 'Priya Sharma', isFollowing: true, followerCount: 234 },
    { userId: 'u2', displayName: 'Rahul Kumar', isFollowing: false, followerCount: 567 }
];

export default SocialProfile;
