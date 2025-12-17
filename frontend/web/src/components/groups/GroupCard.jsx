import React from 'react';
import { Users, Lock, Globe, Hash } from 'lucide-react';

/**
 * GroupCard - Study group preview card
 */
const GroupCard = ({ group, onJoin, onClick }) => {
    const visibilityIcon = {
        PUBLIC: <Globe className="w-4 h-4" />,
        PRIVATE: <Lock className="w-4 h-4" />,
        SECRET: <Lock className="w-4 h-4" />
    };

    return (
        <div
            onClick={() => onClick?.(group)}
            className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all cursor-pointer"
        >
            {/* Cover Image */}
            <div className="h-24 bg-gradient-to-r from-purple-600 to-pink-600 relative">
                {group.coverImageUrl && (
                    <img src={group.coverImageUrl} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full text-xs text-white">
                    {visibilityIcon[group.visibility]}
                    {group.visibility}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-white mb-1">{group.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{group.description}</p>

                {/* Hashtags */}
                {group.hashtags && group.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {group.hashtags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{group.memberCount} members</span>
                    </div>

                    {!group.isMember && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onJoin?.(group.id);
                            }}
                            className="px-3 py-1 text-sm bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                        >
                            Join
                        </button>
                    )}

                    {group.isMember && (
                        <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                            Member
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupCard;
