import React, { useState } from 'react';
import { FiMessageSquare, FiUsers, FiCpu, FiHash, FiPlus, FiSearch, FiMoreVertical } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarSection = ({ title, icon: Icon, children, isOpen, onToggle }) => (
    <div className="mb-4">
        <button
            onClick={onToggle}
            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
            <div className="flex items-center gap-2">
                <Icon size={14} />
                <span>{title}</span>
            </div>
            {/* <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} /> */}
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const ConversationItem = ({ conversation, isSelected, onClick }) => {
    const getIcon = () => {
        switch (conversation.type) {
            case 'AI': return <FiCpu className="text-purple-400" />;
            case 'GROUP': return <FiUsers className="text-blue-400" />;
            default: return <FiMessageSquare className="text-green-400" />;
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(conversation)}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${isSelected
                ? 'bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-white shadow-sm backdrop-blur-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            style={{ width: 'calc(100% - 16px)' }}
        >
            <div className={`p-2 rounded-full ${isSelected ? 'bg-indigo-100 dark:bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {getIcon()}
            </div>
            <div className="flex-1 text-left overflow-hidden">
                <div className="font-medium truncate text-sm">
                    {conversation.name || (conversation.type === 'AI' ? 'AI Assistant' : 'Chat')}
                </div>
                <div className="text-xs opacity-60 truncate">
                    {conversation.lastMessage || 'No messages yet'}
                </div>
            </div>
            {conversation.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {conversation.unreadCount}
                </div>
            )}
        </motion.button>
    );
};

export default function ChatSidebar({
    conversations,
    selectedId,
    onSelect,
    onNewChat
}) {
    const [searchTerm, setSearchTerm] = useState('');

    // Group conversations
    const aiChats = conversations.filter(c => c.type === 'AI');
    const directChats = conversations.filter(c => c.type === 'DIRECT');
    const groupChats = conversations.filter(c => c.type === 'GROUP' && c.contextType === 'GENERAL');
    const spaceChats = conversations.filter(c => c.contextType !== 'GENERAL'); // Classrooms, Projects, etc.

    const filtered = (list) => list.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full h-full bg-white dark:bg-slate-900 flex flex-col border-r border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Messages</h1>
                    <button
                        onClick={onNewChat}
                        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        <FiPlus size={20} />
                    </button>
                </div>

                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-400 dark:placeholder-slate-500 text-sm"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 custom-scrollbar">

                {/* AI Assistant Section */}
                {aiChats.length > 0 && (
                    <SidebarSection title="AI Assistant" icon={FiCpu} isOpen={true} onToggle={() => { }}>
                        {filtered(aiChats).map(c => (
                            <ConversationItem
                                key={c.id}
                                conversation={c}
                                isSelected={selectedId === c.id}
                                onClick={onSelect}
                            />
                        ))}
                    </SidebarSection>
                )}

                {/* Spaces / Contextual */}
                {spaceChats.length > 0 && (
                    <SidebarSection title="Spaces" icon={FiHash} isOpen={true} onToggle={() => { }}>
                        {filtered(spaceChats).map(c => (
                            <ConversationItem
                                key={c.id}
                                conversation={c}
                                isSelected={selectedId === c.id}
                                onClick={onSelect}
                            />
                        ))}
                    </SidebarSection>
                )}

                {/* Direct Messages */}
                <SidebarSection title="Direct Messages" icon={FiMessageSquare} isOpen={true} onToggle={() => { }}>
                    {filtered(directChats).map(c => (
                        <ConversationItem
                            key={c.id}
                            conversation={c}
                            isSelected={selectedId === c.id}
                            onClick={onSelect}
                        />
                    ))}
                </SidebarSection>

                {/* Groups */}
                {groupChats.length > 0 && (
                    <SidebarSection title="Groups" icon={FiUsers} isOpen={true} onToggle={() => { }}>
                        {filtered(groupChats).map(c => (
                            <ConversationItem
                                key={c.id}
                                conversation={c}
                                isSelected={selectedId === c.id}
                                onClick={onSelect}
                            />
                        ))}
                    </SidebarSection>
                )}
            </div>

            {/* User Profile / Settings (Bottom) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
                    <div className="flex-1 text-sm font-medium">My Profile</div>
                    <FiMoreVertical />
                </div>
            </div>
        </div>
    );
}
