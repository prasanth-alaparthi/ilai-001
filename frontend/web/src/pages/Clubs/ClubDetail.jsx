import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, ArrowLeft, Settings, LogOut, UserPlus,
    Send, Pin, Megaphone, MoreVertical, Trash2, Loader2,
    Image as ImageIcon, Calendar, MessageCircle
} from 'lucide-react';
import {
    getClubById, getClubPosts, getClubMembers, getClubEvents, joinClub, leaveClub,
    createClubPost, deleteClubPost, togglePinPost, createEvent, deleteEvent, rsvpEvent,
    CLUB_CATEGORIES, EVENT_TYPES
} from '../../services/clubService';

const ClubDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [club, setClub] = useState(null);
    const [posts, setPosts] = useState([]);
    const [members, setMembers] = useState([]);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [postLoading, setPostLoading] = useState(false);
    const [newPost, setNewPost] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('feed');

    useEffect(() => {
        fetchClubData();
    }, [id]);

    const fetchClubData = async () => {
        setLoading(true);
        try {
            const data = await getClubById(id);
            setClub(data.club);
            setIsMember(data.isMember);

            const postsData = await getClubPosts(id);
            setPosts(postsData);
        } catch (err) {
            console.error('Failed to fetch club:', err);
            setError('Failed to load club');
            // Mock data fallback
            setClub({
                id: parseInt(id),
                name: 'Robotics Club',
                description: 'Building the future, one bot at a time. Join us for weekly builds, competitions, and learning sessions.',
                category: 'COMPETITION',
                memberCount: 24,
                imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80',
                isPrivate: false,
            });
            setPosts([
                { id: 1, authorName: 'Alice', content: 'Excited for our upcoming competition! Who is ready? 🤖', createdAt: new Date().toISOString(), isPinned: true, isAnnouncement: true, likeCount: 5 },
                { id: 2, authorName: 'Bob', content: 'Great workshop yesterday! Learned so much about servo motors.', createdAt: new Date(Date.now() - 3600000).toISOString(), isPinned: false, isAnnouncement: false, likeCount: 3 },
                { id: 3, authorName: 'Charlie', content: 'Does anyone have spare Arduino boards? I need one for my project.', createdAt: new Date(Date.now() - 7200000).toISOString(), isPinned: false, isAnnouncement: false, likeCount: 1 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        try {
            await joinClub(id);
            setIsMember(true);
            setClub(prev => ({ ...prev, memberCount: (prev.memberCount || 0) + 1 }));
        } catch (err) {
            console.error('Failed to join:', err);
            alert(err.response?.data?.message || 'Failed to join club');
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Are you sure you want to leave this club?')) return;
        try {
            await leaveClub(id);
            setIsMember(false);
            setClub(prev => ({ ...prev, memberCount: Math.max(0, (prev.memberCount || 1) - 1) }));
        } catch (err) {
            console.error('Failed to leave:', err);
            alert(err.response?.data?.message || 'Failed to leave club');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        setPostLoading(true);
        try {
            const post = await createClubPost(id, {
                content: newPost,
                isAnnouncement: isAnnouncement,
            });
            setPosts(prev => [post, ...prev]);
            setNewPost('');
            setIsAnnouncement(false);
        } catch (err) {
            console.error('Failed to create post:', err);
            alert('Failed to create post');
        } finally {
            setPostLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await deleteClubPost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (err) {
            console.error('Failed to delete post:', err);
        }
    };

    const handlePinPost = async (postId) => {
        try {
            const updated = await togglePinPost(postId);
            setPosts(prev => prev.map(p => p.id === postId ? updated : p));
        } catch (err) {
            console.error('Failed to pin post:', err);
        }
    };

    const getCategoryInfo = (categoryId) => {
        return CLUB_CATEGORIES.find(c => c.id === categoryId) || { icon: '📚', name: categoryId };
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent-glow animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Header */}
            <div className="relative h-64 md:h-80">
                <div className="absolute inset-0">
                    <img
                        src={club?.imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'}
                        alt={club?.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/clubs')}
                    className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-sm text-white rounded-xl hover:bg-black/50 transition-all"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                {/* Club Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-accent-glow/20 backdrop-blur-sm text-accent-glow rounded-full text-sm font-medium flex items-center gap-1">
                                {getCategoryInfo(club?.category)?.icon}
                                {getCategoryInfo(club?.category)?.name}
                            </span>
                            {club?.isPrivate && (
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                                    Private
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{club?.name}</h1>
                        <p className="text-white/80 text-lg max-w-2xl">{club?.description}</p>

                        <div className="flex items-center gap-6 mt-4">
                            <span className="flex items-center gap-2 text-white/70">
                                <Users size={18} />
                                {club?.memberCount || 0} members
                            </span>

                            {isMember ? (
                                <button
                                    onClick={handleLeave}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                                >
                                    <LogOut size={18} />
                                    Leave Club
                                </button>
                            ) : (
                                <button
                                    onClick={handleJoin}
                                    className="flex items-center gap-2 px-6 py-2 bg-accent-glow text-background font-bold rounded-xl hover:bg-accent-glow/90 transition-all shadow-lg"
                                >
                                    <UserPlus size={18} />
                                    Join Club
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                    {['feed', 'members', 'events'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${activeTab === tab
                                ? 'bg-accent-glow text-background'
                                : 'bg-white/5 text-secondary hover:bg-white/10'
                                }`}
                        >
                            {tab === 'feed' && <MessageCircle size={16} className="inline mr-2" />}
                            {tab === 'members' && <Users size={16} className="inline mr-2" />}
                            {tab === 'events' && <Calendar size={16} className="inline mr-2" />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Feed Tab */}
                {activeTab === 'feed' && (
                    <div className="space-y-6">
                        {/* Create Post */}
                        {isMember && (
                            <motion.form
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onSubmit={handleCreatePost}
                                className="glass-card rounded-2xl p-6 border border-white/10"
                            >
                                <textarea
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    placeholder="Share something with the club..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-glow/50 resize-none"
                                />
                                <div className="flex items-center justify-between mt-4">
                                    <label className="flex items-center gap-2 text-secondary cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isAnnouncement}
                                            onChange={(e) => setIsAnnouncement(e.target.checked)}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-glow"
                                        />
                                        <Megaphone size={16} />
                                        <span className="text-sm">Post as announcement</span>
                                    </label>
                                    <button
                                        type="submit"
                                        disabled={!newPost.trim() || postLoading}
                                        className="flex items-center gap-2 px-5 py-2 bg-accent-glow text-background font-bold rounded-xl hover:bg-accent-glow/90 transition-all disabled:opacity-50"
                                    >
                                        {postLoading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                        Post
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {/* Posts Feed */}
                        <div className="space-y-4">
                            {posts.length === 0 ? (
                                <div className="text-center py-16 text-secondary">
                                    <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No posts yet. Be the first to share something!</p>
                                </div>
                            ) : (
                                posts.map((post, idx) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`glass-card rounded-2xl p-6 border transition-all ${post.isPinned
                                            ? 'border-accent-glow/50 bg-accent-glow/5'
                                            : post.isAnnouncement
                                                ? 'border-yellow-500/30 bg-yellow-500/5'
                                                : 'border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-accent-glow/20 flex items-center justify-center text-accent-glow font-bold">
                                                    {post.authorName?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-primary">{post.authorName}</span>
                                                        {post.isPinned && (
                                                            <Pin size={14} className="text-accent-glow" />
                                                        )}
                                                        {post.isAnnouncement && (
                                                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                                                Announcement
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-secondary">{formatTime(post.createdAt)}</span>
                                                </div>
                                            </div>
                                            {isMember && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePinPost(post.id)}
                                                        className={`p-2 rounded-lg transition-all ${post.isPinned ? 'text-accent-glow bg-accent-glow/10' : 'text-secondary hover:bg-white/10'}`}
                                                    >
                                                        <Pin size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePost(post.id)}
                                                        className="p-2 text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-primary whitespace-pre-wrap">{post.content}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <MembersTab
                        clubId={id}
                        members={members}
                        setMembers={setMembers}
                        membersLoading={membersLoading}
                        setMembersLoading={setMembersLoading}
                        isMember={isMember}
                    />
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                    <EventsTab
                        clubId={id}
                        isMember={isMember}
                    />
                )}
            </div>
        </div>
    );
};

// MembersTab Component
const MembersTab = ({ clubId, members, setMembers, membersLoading, setMembersLoading, isMember }) => {
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        if (!hasLoaded) {
            fetchMembers();
        }
    }, [hasLoaded]);

    const fetchMembers = async () => {
        setMembersLoading(true);
        try {
            const data = await getClubMembers(clubId);
            setMembers(data);
        } catch (err) {
            console.error('Failed to fetch members:', err);
            // Mock data fallback
            setMembers([
                { id: 1, userId: 101, role: 'ADMIN', joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), userName: 'Alice Chen', userEmail: 'alice@school.edu' },
                { id: 2, userId: 102, role: 'MODERATOR', joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), userName: 'Bob Smith', userEmail: 'bob@school.edu' },
                { id: 3, userId: 103, role: 'MEMBER', joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), userName: 'Charlie Brown', userEmail: 'charlie@school.edu' },
                { id: 4, userId: 104, role: 'MEMBER', joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), userName: 'Diana Lee', userEmail: 'diana@school.edu' },
                { id: 5, userId: 105, role: 'MEMBER', joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), userName: 'Eric Wang', userEmail: 'eric@school.edu' },
            ]);
        } finally {
            setMembersLoading(false);
            setHasLoaded(true);
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN':
                return <span className="px-2 py-0.5 bg-accent-glow/20 text-accent-glow rounded text-xs font-medium">Admin</span>;
            case 'MODERATOR':
                return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">Moderator</span>;
            default:
                return <span className="px-2 py-0.5 bg-white/10 text-secondary rounded text-xs font-medium">Member</span>;
        }
    };

    const formatJoinDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (membersLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-accent-glow animate-spin" />
            </div>
        );
    }

    // Group members by role
    const admins = members.filter(m => m.role === 'ADMIN');
    const moderators = members.filter(m => m.role === 'MODERATOR');
    const regularMembers = members.filter(m => m.role === 'MEMBER');

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="flex gap-4">
                <div className="glass-card rounded-xl p-4 border border-white/10 flex-1 text-center">
                    <div className="text-3xl font-bold text-primary">{members.length}</div>
                    <div className="text-sm text-secondary">Total Members</div>
                </div>
                <div className="glass-card rounded-xl p-4 border border-white/10 flex-1 text-center">
                    <div className="text-3xl font-bold text-accent-glow">{admins.length}</div>
                    <div className="text-sm text-secondary">Admins</div>
                </div>
                <div className="glass-card rounded-xl p-4 border border-white/10 flex-1 text-center">
                    <div className="text-3xl font-bold text-blue-400">{moderators.length}</div>
                    <div className="text-sm text-secondary">Moderators</div>
                </div>
            </div>

            {/* Member Groups */}
            {admins.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent-glow"></span>
                        Admins
                    </h3>
                    <div className="grid gap-3">
                        {admins.map((member, idx) => (
                            <MemberCard key={member.id} member={member} idx={idx} getRoleBadge={getRoleBadge} formatJoinDate={formatJoinDate} />
                        ))}
                    </div>
                </div>
            )}

            {moderators.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Moderators
                    </h3>
                    <div className="grid gap-3">
                        {moderators.map((member, idx) => (
                            <MemberCard key={member.id} member={member} idx={idx} getRoleBadge={getRoleBadge} formatJoinDate={formatJoinDate} />
                        ))}
                    </div>
                </div>
            )}

            {regularMembers.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        Members ({regularMembers.length})
                    </h3>
                    <div className="grid gap-3">
                        {regularMembers.map((member, idx) => (
                            <MemberCard key={member.id} member={member} idx={idx} getRoleBadge={getRoleBadge} formatJoinDate={formatJoinDate} />
                        ))}
                    </div>
                </div>
            )}

            {members.length === 0 && (
                <div className="text-center py-16 text-secondary">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No members yet</p>
                </div>
            )}
        </div>
    );
};

// MemberCard Component
const MemberCard = ({ member, idx, getRoleBadge, formatJoinDate }) => {
    const userName = member.userName || `User ${member.userId}`;
    const initial = userName.charAt(0).toUpperCase();

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="glass-card rounded-xl p-4 border border-white/10 flex items-center gap-4 hover:bg-white/5 transition-all"
        >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-glow/30 to-purple-500/30 flex items-center justify-center text-lg font-bold text-primary">
                {initial}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-primary">{userName}</span>
                    {getRoleBadge(member.role)}
                </div>
                <div className="text-xs text-secondary">
                    Joined {formatJoinDate(member.joinedAt)}
                </div>
            </div>
        </motion.div>
    );
};

// EventsTab Component
const EventsTab = ({ clubId, isMember }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventDate: '',
        eventTime: '',
        location: '',
        meetingLink: '',
        eventType: 'MEETING'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [clubId]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await getClubEvents(clubId);
            setEvents(data);
        } catch (err) {
            console.error('Failed to fetch events:', err);
            // Mock data
            setEvents([
                { id: 1, title: 'Weekly Meeting', description: 'Discuss project progress', eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), location: 'Room 101', eventType: 'MEETING', rsvpCount: 12 },
                { id: 2, title: 'Hackathon Prep', description: 'Get ready for the upcoming hackathon', eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), location: 'Online', meetingLink: 'https://meet.google.com/abc', eventType: 'WORKSHOP', rsvpCount: 8 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.eventDate) return;

        setSubmitting(true);
        try {
            const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime || '12:00'}`);
            const event = await createEvent(clubId, {
                title: formData.title,
                description: formData.description,
                eventDate: eventDateTime.toISOString(),
                location: formData.location,
                meetingLink: formData.meetingLink,
                eventType: formData.eventType
            });
            setEvents(prev => [...prev, event]);
            setFormData({ title: '', description: '', eventDate: '', eventTime: '', location: '', meetingLink: '', eventType: 'MEETING' });
            setShowForm(false);
        } catch (err) {
            console.error('Failed to create event:', err);
            alert('Failed to create event');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            await deleteEvent(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch (err) {
            console.error('Failed to delete event:', err);
        }
    };

    const handleRsvp = async (eventId) => {
        try {
            const updated = await rsvpEvent(eventId);
            setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
        } catch (err) {
            console.error('Failed to RSVP:', err);
        }
    };

    const formatEventDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const isUpcoming = (dateStr) => new Date(dateStr) > new Date();

    const getEventTypeInfo = (type) => EVENT_TYPES.find(t => t.id === type) || { icon: '📌', name: type };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-accent-glow animate-spin" />
            </div>
        );
    }

    const upcomingEvents = events.filter(e => isUpcoming(e.eventDate));
    const pastEvents = events.filter(e => !isUpcoming(e.eventDate));

    return (
        <div className="space-y-6">
            {/* Create Event Button */}
            {isMember && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-glow text-background font-bold rounded-xl hover:bg-accent-glow/90 transition-all"
                    >
                        <Calendar size={18} />
                        {showForm ? 'Cancel' : 'Create Event'}
                    </button>
                </div>
            )}

            {/* Create Event Form */}
            {showForm && (
                <motion.form
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="glass-card rounded-2xl p-6 border border-white/10 space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <input
                                type="text"
                                placeholder="Event Title *"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-glow/50"
                            />
                        </div>
                        <div>
                            <input
                                type="date"
                                value={formData.eventDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent-glow/50"
                            />
                        </div>
                        <div>
                            <input
                                type="time"
                                value={formData.eventTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent-glow/50"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Location"
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-glow/50"
                            />
                        </div>
                        <div>
                            <select
                                value={formData.eventType}
                                onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent-glow/50"
                            >
                                {EVENT_TYPES.map(type => (
                                    <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <textarea
                                placeholder="Description (optional)"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-glow/50 resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!formData.title || !formData.eventDate || submitting}
                            className="flex items-center gap-2 px-5 py-2 bg-accent-glow text-background font-bold rounded-xl hover:bg-accent-glow/90 transition-all disabled:opacity-50"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
                            Create Event
                        </button>
                    </div>
                </motion.form>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Upcoming Events ({upcomingEvents.length})
                    </h3>
                    <div className="grid gap-4">
                        {upcomingEvents.map((event, idx) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                idx={idx}
                                isMember={isMember}
                                onDelete={handleDelete}
                                onRsvp={handleRsvp}
                                formatEventDate={formatEventDate}
                                getEventTypeInfo={getEventTypeInfo}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                        Past Events ({pastEvents.length})
                    </h3>
                    <div className="grid gap-4 opacity-60">
                        {pastEvents.map((event, idx) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                idx={idx}
                                isMember={isMember}
                                onDelete={handleDelete}
                                formatEventDate={formatEventDate}
                                getEventTypeInfo={getEventTypeInfo}
                                isPast
                            />
                        ))}
                    </div>
                </div>
            )}

            {events.length === 0 && (
                <div className="text-center py-16 text-secondary">
                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No events scheduled yet</p>
                    {isMember && <p className="text-sm mt-2">Create an event to get started!</p>}
                </div>
            )}
        </div>
    );
};

// EventCard Component
const EventCard = ({ event, idx, isMember, onDelete, onRsvp, formatEventDate, getEventTypeInfo, isPast }) => {
    const typeInfo = getEventTypeInfo(event.eventType);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card rounded-xl p-5 border border-white/10 flex gap-4"
        >
            {/* Date Badge */}
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-accent-glow/20 flex flex-col items-center justify-center">
                <span className="text-2xl">{typeInfo.icon}</span>
            </div>

            {/* Event Info */}
            <div className="flex-1">
                <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-semibold text-primary text-lg">{event.title}</h4>
                        <p className="text-secondary text-sm">{formatEventDate(event.eventDate)}</p>
                    </div>
                    {isMember && !isPast && (
                        <button
                            onClick={() => onDelete(event.id)}
                            className="p-2 text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
                {event.description && (
                    <p className="text-secondary mt-2 text-sm">{event.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                    {event.location && (
                        <span className="text-xs text-secondary">📍 {event.location}</span>
                    )}
                    <span className="text-xs bg-white/10 px-2 py-1 rounded">{typeInfo.name}</span>
                    <span className="text-xs text-secondary">👥 {event.rsvpCount || 0} attending</span>
                </div>
                {!isPast && onRsvp && (
                    <button
                        onClick={() => onRsvp(event.id)}
                        className="mt-3 px-4 py-1.5 bg-accent-glow/20 text-accent-glow text-sm rounded-lg hover:bg-accent-glow/30 transition-all"
                    >
                        RSVP
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default ClubDetail;
