import { useEffect, useRef, useCallback } from 'react';
import feedService from '../services/feedService';

/**
 * useFeedEngagement - Invisible tracking for time spent and scroll depth
 * Tracks user engagement with posts automatically
 */
const useFeedEngagement = (postId, options = {}) => {
    const {
        enabled = true,
        scrollThreshold = 0.5,  // 50% scroll to track
        minTimeSeconds = 3      // Minimum time before tracking
    } = options;

    const viewStartTime = useRef(null);
    const hasTrackedView = useRef(false);
    const containerRef = useRef(null);

    // Track initial view
    useEffect(() => {
        if (!enabled || !postId) return;

        viewStartTime.current = Date.now();

        // Track VIEW event
        if (!hasTrackedView.current) {
            feedService.trackEngagement(postId, 'VIEW').catch(() => { });
            hasTrackedView.current = true;
        }

        return () => {
            // Track time spent when unmounting
            if (viewStartTime.current) {
                const timeSpentSeconds = Math.floor((Date.now() - viewStartTime.current) / 1000);
                if (timeSpentSeconds >= minTimeSeconds) {
                    feedService.trackEngagement(postId, 'SCROLL', timeSpentSeconds, 1.0).catch(() => { });
                }
            }
        };
    }, [postId, enabled, minTimeSeconds]);

    // Track scroll depth using Intersection Observer
    const observeScroll = useCallback((node) => {
        if (!enabled || !node) return;

        containerRef.current = node;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= scrollThreshold) {
                        const timeSpent = viewStartTime.current
                            ? Math.floor((Date.now() - viewStartTime.current) / 1000)
                            : 0;

                        if (timeSpent >= minTimeSeconds) {
                            feedService.trackEngagement(
                                postId,
                                'SCROLL',
                                timeSpent,
                                entry.intersectionRatio
                            ).catch(() => { });
                        }
                    }
                });
            },
            { threshold: [0.25, 0.5, 0.75, 1.0] }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [postId, enabled, scrollThreshold, minTimeSeconds]);

    // Manual engagement tracking
    const trackAction = useCallback((eventType) => {
        if (!enabled || !postId) return;

        const timeSpent = viewStartTime.current
            ? Math.floor((Date.now() - viewStartTime.current) / 1000)
            : 0;

        feedService.trackEngagement(postId, eventType, timeSpent).catch(() => { });
    }, [postId, enabled]);

    return {
        observeScroll,
        trackAction,
        containerRef
    };
};

export default useFeedEngagement;
