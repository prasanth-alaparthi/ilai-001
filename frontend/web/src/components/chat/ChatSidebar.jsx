import React, { useState } from 'react';
import { MessageSquare, Users, Cpu, Hash, Plus, Search, MoreVertical, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarSection = ({ title, icon: Icon, children, isOpen, onToggle }) => (
    <div className="mb-2">
        <button
            onClick={onToggle}
            className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-primary transition-colors group"
        >
            <div className="flex items-center gap-2">
                <Icon size={12} className="group-hover:text-accent-glow transition-colors" />
                <span>{title}</span>
            </div>
            <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
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
            case 'AI': return <Cpu size={16} className="text-purple-400" />;
            case 'GROUP': return <Users size={16} className="text-accent-blue" />;
            default: return <MessageSquare size={16} className="text-accent-green" />;
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(conversation)}
            className={`w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-300 relative group overflow-hidden ${isSelected
                ? 'bg-white/10 text-primary shadow-lg border border-white/10'
                : 'text-secondary hover:bg-white/5 hover:text-primary border border-transparent'
                }`}
            style={{ width: 'calc(100% - 16px)' }}
        >
            <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-white/10' : 'bg-surface-800'}`}>
                {getIcon()}
            </div>
            <div className="flex-1 text-left overflow-hidden z-10">
                <div className="font-bold truncate text-sm mb-0.5">
                    {conversation.name || (conversation.type === 'AI' ? 'AI Assistant' : 'Chat')}
                </div>
                <div className="text-xs opacity-60 truncate font-light">
                    {conversation.lastMessage || 'No messages yet'}
                </div>
            </div>
            {conversation.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-accent-glow flex items-center justify-center text-[10px] font-bold text-white shadow-glow">
                    {conversation.unreadCount}
                </div>
            )}

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
    const spaceChats = conversations.filter(c => c.contextType !== 'GENERAL');

    const filtered = (list) => list.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-serif font-bold text-primary tracking-tight">Messages</h1>
                    <button
                        onClick={onNewChat}
                        className="p-2 bg-primary text-background rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-accent-glow transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-primary pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-accent-glow/50 focus:ring-1 focus:ring-accent-glow/50 placeholder:text-secondary/50 text-sm transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2 space-y-6 custom-scrollbar px-2">

                {/* AI Assistant Section */}
                {aiChats.length > 0 && (
                    <SidebarSection title="AI Assistant" icon={Cpu} isOpen={true} onToggle={() => { }}>
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
                    <SidebarSection title="Spaces" icon={Hash} isOpen={true} onToggle={() => { }}>
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
                <SidebarSection title="Direct Messages" icon={MessageSquare} isOpen={true} onToggle={() => { }}>
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
                    <SidebarSection title="Groups" icon={Users} isOpen={true} onToggle={() => { }}>
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

            {/* Uses Profile / Settings (Bottom) */}
            <div className="p-4 border-t border-black/5 dark:border-white/10 mx-4 mb-4">
                <button className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-xl transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-blue to-accent-green border border-white/10" />
                    <div className="flex-1 text-sm font-bold text-left text-secondary group-hover:text-primary transition-colors">My Profile</div>
                    <MoreVertical size={16} className="text-secondary group-hover:text-primary" />
                </button>
            </div>
        </div>
    );
}
