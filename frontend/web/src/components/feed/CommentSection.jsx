import React, { useState } from 'react';
import { Send, MoreHorizontal, ThumbsUp, Reply, Award } from 'lucide-react';

/**
 * CommentSection for posts
 */
const CommentSection = ({ postId, comments = [], onAddComment }) => {
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment?.({
                postId,
                content: newComment.trim(),
                replyToId: replyTo?.id || null
            });
            setNewComment('');
            setReplyTo(null);
        }
    };

    const formatTimeAgo = (date) => {
        const now = new Date();
        const diff = Math.floor((now - new Date(date)) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    return (
        <div className="mt-4 pt-4 border-t border-white/10">
            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                <div className="flex-1 relative">
                    {replyTo && (
                        <div className="mb-2 text-sm text-gray-400 flex items-center gap-2">
                            <Reply className="w-3 h-3" />
                            Replying to {replyTo.authorName}
                            <button
                                onClick={() => setReplyTo(null)}
                                className="text-red-400 hover:text-red-300"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-400 hover:text-purple-300 disabled:text-gray-600"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={() => setReplyTo(comment)}
                        formatTimeAgo={formatTimeAgo}
                    />
                ))}

                {comments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No comments yet. Be the first!</p>
                )}
            </div>
        </div>
    );
};

const CommentItem = ({ comment, onReply, formatTimeAgo, depth = 0 }) => {
    const [showReplies, setShowReplies] = useState(false);

    return (
        <div className={`${depth > 0 ? 'ml-8 pl-4 border-l border-white/10' : ''}`}>
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 overflow-hidden">
                    {comment.authorAvatar && (
                        <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="flex-1">
                    <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white text-sm">{comment.authorName}</span>
                            {comment.isBestAnswer && (
                                <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                                    <Award className="w-3 h-3" />
                                    Best Answer
                                </span>
                            )}
                        </div>
                        <p className="text-gray-300 text-sm">{comment.content}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                        <button className="hover:text-purple-400 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {comment.likeCount || 0}
                        </button>
                        <button onClick={onReply} className="hover:text-purple-400">
                            Reply
                        </button>
                    </div>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <>
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="text-xs text-purple-400 mt-2 hover:text-purple-300"
                            >
                                {showReplies ? 'Hide' : 'View'} {comment.replies.length} replies
                            </button>
                            {showReplies && (
                                <div className="mt-2 space-y-2">
                                    {comment.replies.map(reply => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            onReply={onReply}
                                            formatTimeAgo={formatTimeAgo}
                                            depth={depth + 1}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentSection;
