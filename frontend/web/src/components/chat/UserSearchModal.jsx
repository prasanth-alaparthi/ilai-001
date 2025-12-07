import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { FiSearch, FiUser, FiUsers, FiCpu, FiX, FiCheck } from 'react-icons/fi';
import debounce from 'debounce';

export default function UserSearchModal({ onClose, onCreated }) {
    const [activeTab, setActiveTab] = useState('DIRECT'); // DIRECT, GROUP, AI
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await apiClient.get(`/users/search?query=${query}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    const debouncedSearch = useCallback(debounce(searchUsers, 300), []);

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);

    const toggleUser = (user) => {
        if (activeTab === 'DIRECT') {
            setSelectedUsers([user]);
        } else {
            if (selectedUsers.find(u => u.id === user.id)) {
                setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
            } else {
                setSelectedUsers(prev => [...prev, user]);
            }
        }
    };

    const handleCreate = async () => {
        try {
            let payload = {
                type: activeTab,
                contextType: 'GENERAL',
                contextId: '0' // Default
            };

            if (activeTab === 'AI') {
                payload.name = 'AI Assistant';
                payload.participantIds = [];
            } else if (activeTab === 'DIRECT') {
                if (selectedUsers.length !== 1) return;
                payload.name = selectedUsers[0].username;
                payload.participantIds = [selectedUsers[0].id];
            } else if (activeTab === 'GROUP') {
                if (!groupName || selectedUsers.length === 0) return;
                payload.name = groupName;
                payload.participantIds = selectedUsers.map(u => u.id);
            }

            const res = await apiClient.post("/chat/conversations", payload);
            onCreated(res.data);
            onClose();
        } catch (err) {
            alert("Failed to create conversation: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[500px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800">New Conversation</h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-slate-50 border-b">
                    {[
                        { id: 'DIRECT', label: 'Direct Message', icon: FiUser },
                        { id: 'GROUP', label: 'New Group', icon: FiUsers },
                        { id: 'AI', label: 'AI Chat', icon: FiCpu },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedUsers([]); setSearchQuery(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">

                    {activeTab === 'AI' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiCpu size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">Start an AI Chat</h3>
                            <p className="text-slate-500 mt-2 text-sm px-8">
                                Chat with our advanced AI assistant to get help with your studies, projects, or just to brainstorm ideas.
                            </p>
                        </div>
                    )}

                    {(activeTab === 'DIRECT' || activeTab === 'GROUP') && (
                        <div className="space-y-4">
                            {activeTab === 'GROUP' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Group Name</label>
                                    <input
                                        value={groupName}
                                        onChange={e => setGroupName(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="e.g. Science Project Team"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                    {activeTab === 'DIRECT' ? 'Search User' : 'Add Members'}
                                </label>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Search by name or email..."
                                    />
                                </div>
                            </div>

                            {/* Selected Users (Chips) */}
                            {selectedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsers.map(u => (
                                        <div key={u.id} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium border border-indigo-100">
                                            <span>{u.username}</span>
                                            <button onClick={() => toggleUser(u)} className="hover:text-indigo-900"><FiX size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Results List */}
                            <div className="space-y-1 mt-2">
                                {loading ? (
                                    <div className="text-center py-4 text-slate-400 text-sm">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => {
                                        const isSelected = selectedUsers.some(u => u.id === user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => toggleUser(user)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-slate-800">{user.username}</div>
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    </div>
                                                </div>
                                                {isSelected && <FiCheck className="text-indigo-600" />}
                                            </button>
                                        );
                                    })
                                ) : searchQuery && (
                                    <div className="text-center py-4 text-slate-400 text-sm">No users found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={
                            (activeTab === 'DIRECT' && selectedUsers.length === 0) ||
                            (activeTab === 'GROUP' && (!groupName || selectedUsers.length === 0))
                        }
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                    >
                        Start Chat
                    </button>
                </div>
            </div>
        </div>
    );
}
