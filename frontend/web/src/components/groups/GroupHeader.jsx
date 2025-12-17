import React from 'react';
import { Users, Lock, Globe, Settings, Share2, Hash } from 'lucide-react';

/**
 * GroupHeader - Group cover and info
 */
const GroupHeader = ({ group, isMember, isAdmin, onJoin, onLeave, onSettings }) => {
    const visibilityIcon = {
        PUBLIC: <Globe className="w-4 h-4" />,
        PRIVATE: <Lock className="w-4 h-4" />,
        SECRET: <Lock className="w-4 h-4" />
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 relative">
                {group.coverImageUrl && (
                    <img src={group.coverImageUrl} alt="" className="w-full h-full object-cover" />
                )}

                {/* Admin Actions */}
                {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={onSettings}
                            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">{group.name}</h1>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                                {visibilityIcon[group.visibility]}
                                {group.visibility} group
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {group.memberCount} members
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <Share2 className="w-5 h-5 text-white" />
                        </button>

                        {!isMember ? (
                            <button
                                onClick={onJoin}
                                className="px-6 py-2 bg-purple-500 text-white font-semibold rounded-full hover:bg-purple-600 transition-colors"
                            >
                                Join Group
                            </button>
                        ) : (
                            <button
                                onClick={onLeave}
                                className="px-6 py-2 bg-white/10 text-white font-semibold rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            >
                                Leave
                            </button>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-4">{group.description}</p>

                {/* Hashtags */}
                {group.hashtags && group.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {group.hashtags.map((tag, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1 text-sm"
                            >
                                <Hash className="w-3 h-3" />
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupHeader;
