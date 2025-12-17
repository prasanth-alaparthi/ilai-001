import { useState, useCallback } from 'react';
import socialService from '../services/socialService';

/**
 * useSocialActions - Hook for follow, friend, and block actions
 */
const useSocialActions = (targetUserId) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [friendStatus, setFriendStatus] = useState('none');
    const [isBlocked, setIsBlocked] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initialize state from user data
    const initializeState = useCallback((userData) => {
        setIsFollowing(userData?.isFollowing || false);
        setFriendStatus(userData?.friendStatus || 'none');
        setIsBlocked(userData?.isBlocked || false);
    }, []);

    // Follow/Unfollow
    const toggleFollow = useCallback(async () => {
        setLoading(true);
        try {
            if (isFollowing) {
                await socialService.unfollow(targetUserId);
                setIsFollowing(false);
                return false;
            } else {
                await socialService.follow(targetUserId);
                setIsFollowing(true);
                return true;
            }
        } catch (error) {
            console.error('Follow action error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [targetUserId, isFollowing]);

    // Send friend request
    const sendFriendRequest = useCallback(async (message = null) => {
        setLoading(true);
        try {
            await socialService.sendFriendRequest(targetUserId, message);
            setFriendStatus('pending');
            return 'pending';
        } catch (error) {
            console.error('Friend request error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [targetUserId]);

    // Accept friend request
    const acceptFriendRequest = useCallback(async (requestId) => {
        setLoading(true);
        try {
            await socialService.acceptFriendRequest(requestId);
            setFriendStatus('friends');
            // Auto-follow when becoming friends
            setIsFollowing(true);
            return 'friends';
        } catch (error) {
            console.error('Accept friend error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Decline friend request
    const declineFriendRequest = useCallback(async (requestId) => {
        setLoading(true);
        try {
            await socialService.declineFriendRequest(requestId);
            setFriendStatus('none');
            return 'none';
        } catch (error) {
            console.error('Decline friend error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Block user (placeholder - needs endpoint)
    const toggleBlock = useCallback(async () => {
        setLoading(true);
        try {
            // Would call block/unblock endpoint
            setIsBlocked(!isBlocked);
            if (!isBlocked) {
                // Auto-unfollow and unfriend when blocking
                setIsFollowing(false);
                setFriendStatus('none');
            }
            return !isBlocked;
        } catch (error) {
            console.error('Block action error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [isBlocked]);

    return {
        // State
        isFollowing,
        friendStatus,
        isBlocked,
        loading,

        // Actions
        toggleFollow,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        toggleBlock,
        initializeState,

        // Setters for external updates
        setIsFollowing,
        setFriendStatus,
        setIsBlocked
    };
};

export default useSocialActions;
