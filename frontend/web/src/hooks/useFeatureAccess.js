import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/apiClient';

/**
 * Hook for checking feature access based on user's subscription tier.
 * 
 * Tiers:
 * - FREE: Basic features (notes, journal, feed)
 * - PREMIUM: All AI features (flashcards, mindmap, quiz, etc.)
 * - INSTITUTIONAL: All features including classroom, assignments, parent portal
 * 
 * Usage:
 * const { canAccess, isPro, isInstitution, tier } = useFeatureAccess();
 * if (canAccess('flashcards')) { ... }
 */

// Feature categories for local checking (mirrors backend)
const FREE_FEATURES = new Set([
    'notes', 'journal', 'feed', 'search', 'calendar',
    'ai_chat_basic', 'profile', 'settings'
]);

const PRO_FEATURES = new Set([
    'flashcards', 'mindmap', 'studyguide', 'quiz',
    'audio_overview', 'voice_notes', 'doubt_solver',
    'deep_research', 'quantum_lab', 'semantic_search',
    'ai_unlimited', 'gamification_full', 'achievements'
]);

const INSTITUTION_FEATURES = new Set([
    'classroom', 'assignments', 'clubs', 'grading',
    'parent_portal', 'teacher_dashboard', 'admin_dashboard',
    'student_progress', 'screen_time', 'performance_alerts'
]);

export function useFeatureAccess() {
    const [accessInfo, setAccessInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load access info on mount
    useEffect(() => {
        loadAccessInfo();
    }, []);

    const loadAccessInfo = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/access');
            setAccessInfo(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to load access info:', err);
            // Default to FREE tier on error
            setAccessInfo({ tier: 'FREE', canAccessPro: false, canAccessInstitution: false });
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Computed properties
    const tier = useMemo(() => accessInfo?.tier || 'FREE', [accessInfo]);
    const isPro = useMemo(() => accessInfo?.canAccessPro || false, [accessInfo]);
    const isInstitution = useMemo(() => accessInfo?.canAccessInstitution || false, [accessInfo]);
    const aiDailyLimit = useMemo(() => accessInfo?.aiDailyLimit ?? 5, [accessInfo]);

    /**
     * Check if user can access a specific feature
     */
    const canAccess = useCallback((feature) => {
        if (!feature) return false;

        // Free features available to all
        if (FREE_FEATURES.has(feature)) {
            return true;
        }

        // Pro features need PREMIUM or INSTITUTIONAL
        if (PRO_FEATURES.has(feature)) {
            return isPro || isInstitution;
        }

        // Institution features only for INSTITUTIONAL
        if (INSTITUTION_FEATURES.has(feature)) {
            return isInstitution;
        }

        // Unknown feature - check with backend or deny
        return false;
    }, [isPro, isInstitution]);

    /**
     * Get required tier for a feature
     */
    const getRequiredTier = useCallback((feature) => {
        if (FREE_FEATURES.has(feature)) return 'FREE';
        if (PRO_FEATURES.has(feature)) return 'PREMIUM';
        if (INSTITUTION_FEATURES.has(feature)) return 'INSTITUTIONAL';
        return 'UNKNOWN';
    }, []);

    /**
     * Get upgrade message for a feature
     */
    const getUpgradeMessage = useCallback((feature) => {
        const requiredTier = getRequiredTier(feature);

        if (requiredTier === 'PREMIUM') {
            return 'Upgrade to Student Pro to unlock this feature';
        }
        if (requiredTier === 'INSTITUTIONAL') {
            return 'This feature is available for school/college accounts';
        }
        return 'Upgrade required';
    }, [getRequiredTier]);

    return {
        // State
        accessInfo,
        loading,
        error,

        // Computed
        tier,
        isPro,
        isInstitution,
        aiDailyLimit,

        // Methods
        canAccess,
        getRequiredTier,
        getUpgradeMessage,
        refresh: loadAccessInfo,
    };
}

export default useFeatureAccess;
