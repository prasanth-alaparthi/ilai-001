import React from 'react';
import { CheckCircle2, Users } from 'lucide-react';
import FollowButton from './FollowButton';

/**
 * SuggestionCard - People you may know
 */
const SuggestionCard = ({ user, onFollow, onDismiss }) => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
            {/* Avatar & Name */}
            <div className="flex items-start justify-between mb-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white font-bold text-xl">
                            {user.displayName?.charAt(0) || '?'}
                        </span>
                    )}
                </div>
                {onDismiss && (
                    <button
                        onClick={() => onDismiss(user.userId)}
                        className="text-gray-500 hover:text-gray-300 text-xl"
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Info */}
            <div className="mb-4">
                <div className="flex items-center gap-1 mb-1">
                    <span className="font-semibold text-white">{user.displayName}</span>
                    {user.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    )}
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">
                    {user.credentials || user.bio || user.institution}
                </p>
            </div>

            {/* Mutual connections */}
            {user.mutualCount > 0 && (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{user.mutualCount} mutual connections</span>
                </div>
            )}

            {/* Subjects/Interests */}
            {user.subjects && user.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                    {user.subjects.slice(0, 3).map((subject, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                            {subject}
                        </span>
                    ))}
                </div>
            )}

            {/* Follow Button */}
            <FollowButton
                userId={user.userId}
                initialFollowing={false}
                onFollowChange={(isFollowing) => onFollow?.(user.userId, isFollowing)}
                size="md"
            />
        </div>
    );
};

export default SuggestionCard;
