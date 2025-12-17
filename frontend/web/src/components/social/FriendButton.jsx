import React, { useState } from 'react';
import { UserPlus, UserCheck, Clock, X, Loader2 } from 'lucide-react';
import socialService from '../../services/socialService';

/**
 * FriendButton - Add friend with request state
 */
const FriendButton = ({
    userId,
    status = 'none', // 'none', 'pending', 'friends', 'received'
    onStatusChange,
    size = 'md'
}) => {
    const [currentStatus, setCurrentStatus] = useState(status);
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            switch (currentStatus) {
                case 'none':
                    await socialService.sendFriendRequest(userId);
                    setCurrentStatus('pending');
                    break;
                case 'pending':
                    // Cancel would need endpoint
                    setCurrentStatus('none');
                    break;
                case 'received':
                    // Accept the request - would need requestId
                    setCurrentStatus('friends');
                    break;
                case 'friends':
                    // Unfriend would need endpoint
                    setCurrentStatus('none');
                    break;
            }
            onStatusChange?.(currentStatus);
        } catch (error) {
            console.error('Friend request error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'px-3 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const getButtonContent = () => {
        if (isLoading) {
            return <Loader2 className="w-4 h-4 animate-spin" />;
        }

        switch (currentStatus) {
            case 'pending':
                return (
                    <>
                        <Clock className="w-4 h-4" />
                        Request Sent
                    </>
                );
            case 'friends':
                return (
                    <>
                        <UserCheck className="w-4 h-4" />
                        Friends
                    </>
                );
            case 'received':
                return (
                    <>
                        <UserPlus className="w-4 h-4" />
                        Accept Request
                    </>
                );
            default:
                return (
                    <>
                        <UserPlus className="w-4 h-4" />
                        Add Friend
                    </>
                );
        }
    };

    const getButtonStyle = () => {
        switch (currentStatus) {
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
            case 'friends':
                return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'received':
                return 'bg-blue-500 text-white';
            default:
                return 'bg-purple-500 text-white hover:bg-purple-600';
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`${sizeClasses[size]} rounded-full font-medium flex items-center gap-2 transition-all ${getButtonStyle()}`}
        >
            {getButtonContent()}
        </button>
    );
};

export default FriendButton;
