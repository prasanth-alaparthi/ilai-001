import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/apiClient';

/**
 * Hook for gamification stats, achievements, and XP tracking
 */
export function useGamification(userId = null) {
    const [stats, setStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load stats on mount
    useEffect(() => {
        if (userId !== undefined) {
            loadStats();
        }
    }, [userId]);

    const loadStats = useCallback(async () => {
        try {
            setLoading(true);
            const endpoint = userId ? `/api/gamification/stats/${userId}` : '/api/gamification/stats';
            const response = await apiClient.get(endpoint);
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to load gamification stats:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const loadAchievements = useCallback(async () => {
        try {
            const endpoint = userId ? `/api/gamification/achievements/${userId}` : '/api/gamification/achievements';
            const response = await apiClient.get(endpoint);
            setAchievements(response.data);
        } catch (err) {
            console.error('Failed to load achievements:', err);
        }
    }, [userId]);

    // Computed values
    const level = useMemo(() => stats?.level || 1, [stats]);
    const totalXp = useMemo(() => stats?.totalXp || 0, [stats]);
    const currentStreak = useMemo(() => stats?.currentStreak || 0, [stats]);
    const progress = useMemo(() => stats?.progressToNextLevel || 0, [stats]);
    const xpToNext = useMemo(() => stats?.xpToNextLevel || 0, [stats]);

    // XP formatting
    const formatXp = useCallback((xp) => {
        if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
        if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
        return xp.toString();
    }, []);

    // Level title
    const getLevelTitle = useCallback((lvl) => {
        if (lvl >= 50) return 'Master';
        if (lvl >= 25) return 'Expert';
        if (lvl >= 10) return 'Scholar';
        if (lvl >= 5) return 'Learner';
        return 'Beginner';
    }, []);

    return {
        stats,
        achievements,
        loading,
        error,
        level,
        totalXp,
        currentStreak,
        progress,
        xpToNext,
        formatXp,
        getLevelTitle,
        refresh: loadStats,
        loadAchievements,
    };
}

/**
 * Hook for leaderboard data
 */
export function useLeaderboard(type = 'xp', limit = 10) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, [type, limit]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/api/gamification/leaderboard?type=${type}&limit=${limit}`);
            setLeaderboard(response.data);
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    return { leaderboard, loading, refresh: loadLeaderboard };
}

/**
 * Hook for triggering gamification events
 */
export function useGamificationEvents() {
    const [lastReward, setLastReward] = useState(null);

    const onNoteCreated = async (noteId) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await apiClient.post('/api/gamification/events/note-created', {
                userId: user.id,
                noteId
            });
            setLastReward(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to log note creation:', err);
        }
    };

    const onQuizCompleted = async (quizId, score, total) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await apiClient.post('/api/gamification/events/quiz-completed', {
                userId: user.id,
                quizId,
                score,
                total
            });
            setLastReward(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to log quiz completion:', err);
        }
    };

    const onFlashcardsReviewed = async (count) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await apiClient.post('/api/gamification/events/flashcards-reviewed', {
                userId: user.id,
                count
            });
            setLastReward(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to log flashcard review:', err);
        }
    };

    const onStudySession = async (durationMinutes) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await apiClient.post('/api/gamification/events/study-session', {
                userId: user.id,
                durationMinutes
            });
            setLastReward(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to log study session:', err);
        }
    };

    return {
        lastReward,
        onNoteCreated,
        onQuizCompleted,
        onFlashcardsReviewed,
        onStudySession,
    };
}

export default useGamification;
