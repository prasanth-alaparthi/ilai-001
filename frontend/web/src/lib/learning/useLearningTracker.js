/**
 * ILAI Hyper Platform - useLearningTracker Hook
 * 
 * React hook to integrate background learning with components.
 * Automatically tracks user interactions silently.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { getLearningService } from './background-learning';

/**
 * Hook for automatic learning tracking in components
 */
export function useLearningTracker(options = {}) {
    const serviceRef = useRef(null);
    const startTimeRef = useRef(null);

    // Initialize service
    useEffect(() => {
        const init = async () => {
            serviceRef.current = await getLearningService();
            startTimeRef.current = Date.now();

            // Set topic context if provided
            if (options.topic) {
                serviceRef.current.setCurrentTopic(options.topic);
            }
        };
        init();

        // Track session end
        return () => {
            if (startTimeRef.current && serviceRef.current) {
                const duration = Date.now() - startTimeRef.current;
                if (duration > 5000) { // Only track if > 5 seconds
                    serviceRef.current.trackStudySession(
                        options.topic || 'general',
                        duration,
                        {
                            startTime: startTimeRef.current,
                            endTime: Date.now()
                        }
                    );
                }
            }
        };
    }, [options.topic]);

    // Track note activity
    const trackNote = useCallback(async (noteId, action, metadata = {}) => {
        if (serviceRef.current) {
            await serviceRef.current.trackNoteActivity(noteId, action, {
                ...metadata,
                subject: options.topic
            });
        }
    }, [options.topic]);

    // Track quiz performance
    const trackQuiz = useCallback(async (quizId, result, metadata = {}) => {
        if (serviceRef.current) {
            await serviceRef.current.trackQuizPerformance(quizId, result, {
                ...metadata,
                subject: options.topic
            });
        }
    }, [options.topic]);

    // Track search
    const trackSearch = useCallback(async (query, results = []) => {
        if (serviceRef.current) {
            await serviceRef.current.trackSearch(query, results);
        }
    }, []);

    // Track engagement
    const trackEngagement = useCallback(async (contentId, type, data = {}) => {
        if (serviceRef.current) {
            await serviceRef.current.trackEngagement(contentId, type, data);
        }
    }, []);

    // Get learning context for AI
    const getLearningContext = useCallback(async () => {
        if (serviceRef.current) {
            return await serviceRef.current.getLearningContext();
        }
        return null;
    }, []);

    return {
        trackNote,
        trackQuiz,
        trackSearch,
        trackEngagement,
        getLearningContext
    };
}

/**
 * Hook for scroll depth tracking
 */
export function useScrollTracker(contentId) {
    const maxScrollRef = useRef(0);
    const serviceRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        const init = async () => {
            serviceRef.current = await getLearningService();
        };
        init();

        const handleScroll = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);

            // Track final engagement on unmount
            if (serviceRef.current && contentId) {
                serviceRef.current.trackEngagement(contentId, 'view', {
                    scrollDepth: maxScrollRef.current,
                    timeOnPage: Date.now() - startTimeRef.current
                });
            }
        };
    }, [contentId]);

    return { maxScroll: maxScrollRef };
}

/**
 * Hook to get learning insights
 */
export function useLearningInsights() {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const service = await getLearningService();
                const context = await service.getLearningContext();
                setInsights(context);
            } catch (error) {
                console.error('[Learning] Failed to load insights:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return { insights, loading };
}

export default useLearningTracker;
