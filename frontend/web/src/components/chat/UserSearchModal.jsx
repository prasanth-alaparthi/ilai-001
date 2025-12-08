import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import { Search, User, Users, Cpu, X, Check, ArrowRight } from 'lucide-react';
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="glass-panel w-[500px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-black/5 dark:border-white/10 flex justify-between items-center bg-surface/30">
                    <h2 className="text-xl font-serif font-medium text-primary">New Conversation</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-secondary hover:text-primary transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 border-b border-black/5 dark:border-white/10 bg-surface/20">
                    {[
                        { id: 'DIRECT', label: 'Direct', icon: User },
                        { id: 'GROUP', label: 'Group', icon: Users },
                        { id: 'AI', label: 'AI Chat', icon: Cpu },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedUsers([]); setSearchQuery(''); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === tab.id
                                ? 'bg-white/10 text-accent-glow shadow-lg border border-white/10'
                                : 'text-secondary hover:text-primary hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">

                    {activeTab === 'AI' && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow border border-purple-500/20">
                                <Cpu size={40} />
                            </div>
                            <h3 className="text-xl font-medium text-primary mb-2">Start an AI Chat</h3>
                            <p className="text-secondary text-sm px-8 leading-relaxed font-light">
                                Chat with our advanced AI assistant to get help with your studies, projects, or just to brainstorm ideas.
                            </p>
                        </div>
                    )}

                    {(activeTab === 'DIRECT' || activeTab === 'GROUP') && (
                        <div className="space-y-6">
                            {activeTab === 'GROUP' && (
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Group Name</label>
                                    <input
                                        value={groupName}
                                        onChange={e => setGroupName(e.target.value)}
                                        className="w-full p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:border-accent-glow/50 focus:outline-none focus:ring-1 focus:ring-accent-glow/50 text-primary placeholder:text-secondary/50 font-light"
                                        placeholder="e.g. Science Project Team"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                                    {activeTab === 'DIRECT' ? 'Search User' : 'Add Members'}
                                </label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-3.5 text-secondary group-focus-within:text-accent-glow transition-colors" size={16} />
                                    <input
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full p-3 pl-10 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl focus:border-accent-glow/50 focus:outline-none focus:ring-1 focus:ring-accent-glow/50 text-primary placeholder:text-secondary/50 font-light"
                                        placeholder="Search by name or email..."
                                    />
                                </div>
                            </div>

                            {/* Selected Users (Chips) */}
                            {selectedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsers.map(u => (
                                        <div key={u.id} className="flex items-center gap-1 bg-accent-glow/10 text-accent-glow px-3 py-1 rounded-full text-xs font-bold border border-accent-glow/20">
                                            <span>{u.username}</span>
                                            <button onClick={() => toggleUser(u)} className="hover:text-white transition-colors"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Results List */}
                            <div className="space-y-2 mt-2">
                                {loading ? (
                                    <div className="text-center py-8 text-secondary text-sm animate-pulse">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => {
                                        const isSelected = selectedUsers.some(u => u.id === user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => toggleUser(user)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isSelected ? 'bg-accent-glow/10 border border-accent-glow/30' : 'hover:bg-white/5 border border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-surface-800 flex items-center justify-center text-secondary font-bold text-xs border border-white/10">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium text-primary">{user.username}</div>
                                                        <div className="text-xs text-secondary font-light">{user.email}</div>
                                                    </div>
                                                </div>
                                                {isSelected && <Check className="text-accent-glow" size={16} />}
                                            </button>
                                        );
                                    })
                                ) : searchQuery && (
                                    <div className="text-center py-8 text-secondary text-sm glass-panel border-dashed">No users found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-black/5 dark:border-white/10 bg-surface/20 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-secondary font-medium hover:text-primary hover:bg-white/5 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={
                            (activeTab === 'DIRECT' && selectedUsers.length === 0) ||
                            (activeTab === 'GROUP' && (!groupName || selectedUsers.length === 0))
                        }
                        className="px-6 py-2.5 bg-gradient-to-r from-accent-blue to-accent-glow text-white font-medium rounded-xl hover:shadow-glow hover:shadow-accent-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <span>Start Chat</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
