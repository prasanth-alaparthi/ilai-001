import React from 'react';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal } from 'lucide-react';

/**
 * Engagement bar with like, comment, save, share buttons
 */
const EngagementBar = ({
    isLiked,
    isSaved,
    likeCount,
    commentCount,
    onLike,
    onComment,
    onSave,
    onShare,
    compact = false
}) => {
    const buttonClass = compact
        ? "flex items-center gap-1 p-2 rounded-lg transition-all"
        : "flex items-center gap-2 px-4 py-2 rounded-lg transition-all";

    return (
        <div className={`flex items-center ${compact ? 'gap-1' : 'justify-between'} pt-3 border-t border-white/10`}>
            <button
                onClick={onLike}
                className={`${buttonClass} ${isLiked
                        ? 'text-pink-500 bg-pink-500/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-pink-400'
                    }`}
            >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount > 0 && <span className={compact ? "text-xs" : "font-medium"}>{likeCount}</span>}
                {!compact && <span className="font-medium">Like</span>}
            </button>

            <button
                onClick={onComment}
                className={`${buttonClass} text-gray-400 hover:bg-white/5 hover:text-blue-400`}
            >
                <MessageCircle className="w-5 h-5" />
                {commentCount > 0 && <span className={compact ? "text-xs" : "font-medium"}>{commentCount}</span>}
                {!compact && <span className="font-medium">Comment</span>}
            </button>

            <button
                onClick={onSave}
                className={`${buttonClass} ${isSaved
                        ? 'text-yellow-500 bg-yellow-500/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-yellow-400'
                    }`}
            >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                {!compact && <span className="font-medium">Save</span>}
            </button>

            <button
                onClick={onShare}
                className={`${buttonClass} text-gray-400 hover:bg-white/5 hover:text-green-400`}
            >
                <Share2 className="w-5 h-5" />
                {!compact && <span className="font-medium">Share</span>}
            </button>
        </div>
    );
};

export default EngagementBar;
