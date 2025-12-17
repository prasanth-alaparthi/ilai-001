import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Users, Settings, Share2 } from 'lucide-react';
import GroupHeader from '../components/groups/GroupHeader';
import MemberList from '../components/groups/MemberList';
import NeuroFeedCard from '../components/feed/NeuroFeedCard';
import CreatePostModal from '../components/feed/CreatePostModal';
import groupService from '../services/groupService';
import feedService from '../services/feedService';

/**
 * GroupDetail - Single study group view
 */
const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [loading, setLoading] = useState(true);
    const [showCreatePost, setShowCreatePost] = useState(false);

    const currentUserId = localStorage.getItem('userId') || 'current';

    useEffect(() => {
        loadGroup();
    }, [groupId]);

    const loadGroup = async () => {
        setLoading(true);
        try {
            const [groupData, membersData] = await Promise.all([
                groupService.getGroup(groupId),
                groupService.getGroupMembers(groupId)
            ]);
            setGroup(groupData);
            setMembers(membersData);

            // Load group posts (would need endpoint)
            const allPosts = await feedService.getFeed(50, 0);
            setPosts(allPosts.filter(p => p.groupId === groupId).slice(0, 20));
        } catch (error) {
            console.error('Load group error:', error);
            // Mock data
            setGroup(getMockGroup());
            setMembers(getMockMembers());
            setPosts(getMockPosts());
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        try {
            await groupService.joinGroup(groupId);
            setGroup(prev => ({ ...prev, isMember: true, memberCount: prev.memberCount + 1 }));
        } catch (error) {
            console.error('Join error:', error);
        }
    };

    const handleLeave = async () => {
        try {
            await groupService.leaveGroup(groupId);
            setGroup(prev => ({ ...prev, isMember: false, memberCount: prev.memberCount - 1 }));
        } catch (error) {
            console.error('Leave error:', error);
        }
    };

    const handlePostCreated = (newPost) => {
        setPosts(prev => [{ ...newPost, groupId }, ...prev]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl text-white mb-4">Group not found</h2>
                    <button onClick={() => navigate('/groups')} className="text-purple-400">
                        Back to Groups
                    </button>
                </div>
            </div>
        );
    }

    const isAdmin = members.some(m => m.userId === currentUserId && ['OWNER', 'ADMIN'].includes(m.role));

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/groups')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Groups
                </button>

                {/* Group Header */}
                <GroupHeader
                    group={group}
                    isMember={group.isMember}
                    isAdmin={isAdmin}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    onSettings={() => console.log('Settings')}
                />

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl my-6">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${activeTab === 'posts' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeTab === 'members' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Members ({group.memberCount})
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'posts' && (
                    <>
                        {/* Create Post Button */}
                        {group.isMember && (
                            <button
                                onClick={() => setShowCreatePost(true)}
                                className="w-full flex items-center justify-center gap-2 p-4 mb-4 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Share something with the group...
                            </button>
                        )}

                        {/* Posts */}
                        <div className="space-y-4">
                            {posts.map(post => (
                                <NeuroFeedCard key={post.id} post={post} />
                            ))}
                            {posts.length === 0 && (
                                <div className="text-center py-16 text-gray-500">
                                    No posts in this group yet
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'members' && (
                    <MemberList members={members} isAdmin={isAdmin} />
                )}
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={showCreatePost}
                onClose={() => setShowCreatePost(false)}
                onPostCreated={handlePostCreated}
            />
        </div>
    );
};

// Mock data
const getMockGroup = () => ({
    id: 'g1',
    name: 'JEE Physics Masters',
    description: 'A community for passionate physics students preparing for JEE. Share insights, solve doubts, and grow together!',
    memberCount: 1234,
    hashtags: ['physics', 'jee', 'mechanics', 'electromagnetism'],
    visibility: 'PUBLIC',
    isMember: true,
    groupType: 'EXAM',
    createdBy: 'user1'
});

const getMockMembers = () => [
    { userId: 'u1', displayName: 'Dr. Sharma', role: 'OWNER', joinedAt: '2024-01-01' },
    { userId: 'u2', displayName: 'Priya Patel', role: 'ADMIN', joinedAt: '2024-02-15' },
    { userId: 'u3', displayName: 'Rahul Kumar', role: 'MEMBER', joinedAt: '2024-03-20' }
];

const getMockPosts = () => [
    { id: 1, authorName: 'Dr. Sharma', content: "Today's physics tip: Always draw free body diagrams!", likeCount: 45, commentCount: 12, createdAt: new Date().toISOString() },
    { id: 2, authorName: 'Priya Patel', content: 'Can someone explain rotational dynamics?', likeCount: 23, commentCount: 8, createdAt: new Date().toISOString() }
];

export default GroupDetail;
