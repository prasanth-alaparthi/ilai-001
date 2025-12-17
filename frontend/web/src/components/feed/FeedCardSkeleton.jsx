import React from 'react';

/**
 * Loading skeleton for feed cards
 */
const FeedCardSkeleton = () => {
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-4 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded w-32 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-48" />
                </div>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-4">
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-4/5" />
                <div className="h-4 bg-white/10 rounded w-3/5" />
            </div>

            {/* Hashtags */}
            <div className="flex gap-2 mb-4">
                <div className="h-6 bg-white/10 rounded-full w-20" />
                <div className="h-6 bg-white/10 rounded-full w-16" />
                <div className="h-6 bg-white/10 rounded-full w-24" />
            </div>

            {/* Engagement Bar */}
            <div className="flex justify-between pt-4 border-t border-white/10">
                <div className="h-8 bg-white/10 rounded-lg w-20" />
                <div className="h-8 bg-white/10 rounded-lg w-24" />
                <div className="h-8 bg-white/10 rounded-lg w-16" />
                <div className="h-8 bg-white/10 rounded-lg w-18" />
            </div>
        </div>
    );
};

export default FeedCardSkeleton;
