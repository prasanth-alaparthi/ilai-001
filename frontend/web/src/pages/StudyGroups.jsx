import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, TrendingUp, Loader2 } from 'lucide-react';
import GroupCard from '../components/groups/GroupCard';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import groupService from '../services/groupService';

/**
 * StudyGroups - Groups discovery and management page
 */
const StudyGroups = () => {
    const [activeTab, setActiveTab] = useState('my');
    const [myGroups, setMyGroups] = useState([]);
    const [discoverGroups, setDiscoverGroups] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const [my, discover] = await Promise.all([
                groupService.getMyGroups(),
                groupService.discoverGroups(20)
            ]);
            setMyGroups(my);
            setDiscoverGroups(discover);
        } catch (error) {
            console.error('Load groups error:', error);
            // Mock data
            setMyGroups(getMockGroups(true));
            setDiscoverGroups(getMockGroups(false));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const results = await groupService.searchGroups(query);
                setSearchResults(results);
            } catch (error) {
                setSearchResults([]);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleJoin = async (groupId) => {
        try {
            await groupService.joinGroup(groupId);
            loadGroups();
        } catch (error) {
            console.error('Join error:', error);
        }
    };

    const handleGroupCreated = (newGroup) => {
        setMyGroups(prev => [newGroup, ...prev]);
        setActiveTab('my');
    };

    const tabs = [
        { id: 'my', label: 'My Groups', icon: Users },
        { id: 'discover', label: 'Discover', icon: TrendingUp }
    ];

    const displayGroups = activeTab === 'my' ? myGroups :
        searchQuery.length > 2 ? searchResults : discoverGroups;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Users className="w-8 h-8 text-purple-400" />
                            Study Groups
                        </h1>
                        <p className="text-gray-400 mt-1">Join communities of learners</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Group
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search groups..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.id === 'my' && myGroups.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                                    {myGroups.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                    </div>
                ) : displayGroups.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {activeTab === 'my' ? 'No groups yet' : 'No groups found'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {activeTab === 'my'
                                ? 'Join or create a group to get started!'
                                : 'Try a different search term'}
                        </p>
                        {activeTab === 'my' && (
                            <button
                                onClick={() => setActiveTab('discover')}
                                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium"
                            >
                                Discover Groups
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayGroups.map(group => (
                            <GroupCard
                                key={group.id}
                                group={group}
                                onJoin={handleJoin}
                                onClick={(g) => window.location.href = `/groups/${g.id}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onGroupCreated={handleGroupCreated}
            />
        </div>
    );
};

// Mock data
const getMockGroups = (isMember) => [
    {
        id: 'g1',
        name: 'JEE Physics Masters',
        description: 'Advanced physics concepts for JEE preparation',
        memberCount: 1234,
        hashtags: ['physics', 'jee', 'mechanics'],
        visibility: 'PUBLIC',
        isMember,
        groupType: 'EXAM'
    },
    {
        id: 'g2',
        name: 'NEET Biology Club',
        description: 'Human physiology and botany discussions',
        memberCount: 2567,
        hashtags: ['biology', 'neet', 'medical'],
        visibility: 'PUBLIC',
        isMember,
        groupType: 'EXAM'
    },
    {
        id: 'g3',
        name: 'Competitive Coding',
        description: 'DSA, algorithms, and CP practice',
        memberCount: 890,
        hashtags: ['coding', 'dsa', 'competitive'],
        visibility: 'PUBLIC',
        isMember,
        groupType: 'TOPIC'
    }
];

export default StudyGroups;
