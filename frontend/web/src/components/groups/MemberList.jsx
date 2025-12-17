import React from 'react';
import { Crown, Shield, User, MoreHorizontal, UserMinus } from 'lucide-react';

/**
 * MemberList - Group members list with roles
 */
const MemberList = ({ members = [], isAdmin, onRemoveMember, onPromote }) => {
    const roleIcons = {
        OWNER: <Crown className="w-4 h-4 text-yellow-400" />,
        ADMIN: <Shield className="w-4 h-4 text-blue-400" />,
        MODERATOR: <Shield className="w-4 h-4 text-green-400" />,
        MEMBER: null
    };

    const roleLabels = {
        OWNER: 'Owner',
        ADMIN: 'Admin',
        MODERATOR: 'Mod',
        MEMBER: 'Member'
    };

    return (
        <div className="space-y-2">
            {members.map((member) => (
                <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                            {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{member.displayName}</span>
                                {roleIcons[member.role]}
                            </div>
                            <div className="text-sm text-gray-400">
                                Joined {formatDate(member.joinedAt)}
                            </div>
                        </div>
                    </div>

                    {isAdmin && member.role !== 'OWNER' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-400">
                                {roleLabels[member.role]}
                            </span>
                            <button className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {members.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No members yet
                </div>
            )}
        </div>
    );
};

const formatDate = (dateString) => {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export default MemberList;
