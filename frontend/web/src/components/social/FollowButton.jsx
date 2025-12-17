import React, { useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import socialService from '../../services/socialService';

/**
 * FollowButton component
 */
const FollowButton = ({ userId, initialFollowing = false, onFollowChange, size = 'md' }) => {
    const [isFollowing, setIsFollowing] = useState(initialFollowing);
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            if (isFollowing) {
                await socialService.unfollow(userId);
            } else {
                await socialService.follow(userId);
            }
            setIsFollowing(!isFollowing);
            onFollowChange?.(!isFollowing);
        } catch (error) {
            console.error('Follow error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'px-3 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`${sizeClasses[size]} rounded-full font-medium flex items-center gap-2 transition-all ${isFollowing
                    ? 'bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400'
                    : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserCheck className="w-4 h-4" />
                    Following
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                </>
            )}
        </button>
    );
};

export default FollowButton;
