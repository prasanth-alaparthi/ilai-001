import React from 'react';
import MessageList from './messageList';
import MessageInput from './messageInput';
import { FiMoreHorizontal, FiPhone, FiVideo, FiCpu, FiUsers, FiHash } from 'react-icons/fi';

export default function ChatWindow({ conversation, messages, currentUserId, onSend }) {
    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <FiUsers size={40} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-600">No Chat Selected</h3>
                <p className="text-sm">Select a conversation from the sidebar to start chatting.</p>
            </div>
        );
    }

    const getIcon = () => {
        switch (conversation.type) {
            case 'AI': return <FiCpu className="text-purple-600" />;
            case 'GROUP': return <FiUsers className="text-blue-600" />;
            default: return <FiHash className="text-green-600" />;
        }
    };

    const [replyingTo, setReplyingTo] = React.useState(null);

    const handleReply = (msg) => {
        setReplyingTo(msg);
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
    };

    const handleSendWrapper = (text, mediaUrl) => {
        onSend(text, mediaUrl, replyingTo?.id);
        setReplyingTo(null);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${conversation.type === 'AI' ? 'bg-purple-100' : 'bg-indigo-50'
                        }`}>
                        {getIcon()}
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            {conversation.name || (conversation.type === 'AI' ? 'AI Assistant' : 'Chat')}
                            {conversation.contextType !== 'GENERAL' && (
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200 uppercase tracking-wide">
                                    {conversation.contextType}
                                </span>
                            )}
                        </h2>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            {conversation.participantIds?.length || 1} members
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                        <FiPhone size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                        <FiVideo size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                        <FiMoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <MessageList messages={messages} meUserId={currentUserId} onReply={handleReply} />

            {/* Input */}
            <MessageInput onSend={handleSendWrapper} replyingTo={replyingTo} onCancelReply={handleCancelReply} />
        </div>
    );
}
