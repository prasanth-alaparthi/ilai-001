import React from 'react';
import { CheckCircle2, MapPin, Calendar, Link as LinkIcon, Edit2 } from 'lucide-react';
import FollowButton from '../social/FollowButton';
import FriendButton from '../social/FriendButton';

/**
 * ProfileHeader - User profile header with avatar, bio, stats
 */
const ProfileHeader = ({
    profile,
    isOwnProfile = false,
    onEditProfile,
    onFollow,
    onFriend
}) => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 relative">
                {profile.coverImageUrl && (
                    <img src={profile.coverImageUrl} alt="" className="w-full h-full object-cover" />
                )}
            </div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="relative -mt-16 mb-4">
                    <div className="w-32 h-32 rounded-full border-4 border-gray-900 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-4xl">
                                {profile.displayName?.charAt(0) || '?'}
                            </span>
                        )}
                    </div>

                    {isOwnProfile && (
                        <button
                            onClick={onEditProfile}
                            className="absolute bottom-0 right-0 p-2 bg-purple-500 rounded-full hover:bg-purple-600 transition-colors"
                        >
                            <Edit2 className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>

                {/* Name & Credentials */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
                            {profile.isVerified && (
                                <CheckCircle2 className="w-6 h-6 text-blue-400" />
                            )}
                        </div>
                        {profile.credentials && (
                            <p className="text-purple-400 font-medium">{profile.credentials}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {!isOwnProfile && (
                        <div className="flex gap-2">
                            <FollowButton
                                userId={profile.userId}
                                initialFollowing={profile.isFollowing}
                                onFollowChange={onFollow}
                            />
                            <FriendButton
                                userId={profile.userId}
                                status={profile.friendStatus || 'none'}
                                onStatusChange={onFriend}
                            />
                        </div>
                    )}

                    {isOwnProfile && (
                        <button
                            onClick={onEditProfile}
                            className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-gray-300 mb-4">{profile.bio}</p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
                    {profile.institution && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {profile.institution}
                        </span>
                    )}
                    {profile.educationLevel && (
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {profile.educationLevel} {profile.graduationYear && `• ${profile.graduationYear}`}
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="flex gap-6">
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.postCount || 0}</div>
                        <div className="text-sm text-gray-400">Posts</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.followerCount || 0}</div>
                        <div className="text-sm text-gray-400">Followers</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.followingCount || 0}</div>
                        <div className="text-sm text-gray-400">Following</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{profile.friendCount || 0}</div>
                        <div className="text-sm text-gray-400">Friends</div>
                    </div>
                </div>

                {/* Subjects */}
                {profile.subjects && profile.subjects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex flex-wrap gap-2">
                            {profile.subjects.map((subject, i) => (
                                <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                                    {subject}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileHeader;
