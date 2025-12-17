import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import FollowButton from './FollowButton';

/**
 * PeopleList - Display list of users (followers, following, etc.)
 */
const PeopleList = ({
    users = [],
    title,
    emptyMessage = "No users to display",
    showFollowButton = true,
    onUserClick
}) => {
    if (users.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div>
            {title && (
                <h3 className="text-sm font-medium text-gray-400 mb-3">{title}</h3>
            )}
            <div className="space-y-2">
                {users.map((user) => (
                    <div
                        key={user.userId || user.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => onUserClick?.(user)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white font-bold">
                                        {user.displayName?.charAt(0) || '?'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-white">{user.displayName}</span>
                                    {user.isVerified && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                    )}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {user.credentials || user.institution || `${user.followerCount || 0} followers`}
                                </div>
                            </div>
                        </div>

                        {showFollowButton && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <FollowButton
                                    userId={user.userId}
                                    initialFollowing={user.isFollowing}
                                    size="sm"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PeopleList;
