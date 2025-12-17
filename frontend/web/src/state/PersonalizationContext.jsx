import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

const PersonalizationContext = createContext();

export function usePersonalization() {
    return useContext(PersonalizationContext);
}

export function PersonalizationProvider({ children }) {
    const [profile, setProfile] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load personalization data on mount
    useEffect(() => {
        loadProfile();
        loadRecommendations();
    }, []);

    const loadProfile = useCallback(async () => {
        try {
            const response = await apiClient.get('/personalization/profile');
            setProfile(response.data);
        } catch (error) {
            // Profile might not exist yet - that's okay
            console.debug('No personalization profile yet');
        }
    }, []);

    const loadRecommendations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/personalization/recommendations');
            setRecommendations(response.data);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateLearningStyle = useCallback(async (style) => {
        try {
            await apiClient.put('/personalization/learning-style', { style });
            setProfile(prev => ({ ...prev, learningStyle: style }));
        } catch (error) {
            console.error('Failed to update learning style:', error);
        }
    }, []);

    const updatePreferences = useCallback(async (preferences) => {
        try {
            await apiClient.put('/personalization/preferences', preferences);
            setProfile(prev => ({
                ...prev,
                studyPreferences: { ...prev?.studyPreferences, ...preferences }
            }));
        } catch (error) {
            console.error('Failed to update preferences:', error);
        }
    }, []);

    // Get adaptive difficulty based on skill level
    const getAdaptiveDifficulty = useCallback((topic) => {
        if (!profile?.skillLevels) return 'medium';
        const skill = profile.skillLevels[topic?.toLowerCase()];
        if (skill === undefined) return 'medium';
        if (skill < 0.3) return 'easy';
        if (skill < 0.7) return 'medium';
        return 'hard';
    }, [profile]);

    // Check if user is interested in a topic
    const isInterestedIn = useCallback((topic) => {
        if (!profile?.topicInterests) return false;
        const interest = profile.topicInterests[topic?.toLowerCase()];
        return interest && interest > 5;
    }, [profile]);

    const value = {
        // State
        profile,
        recommendations,
        isLoading,

        // Getters
        learningStyle: profile?.learningStyle || 'visual',
        topTopics: recommendations?.topics || [],
        difficulty: recommendations?.difficulty || 'medium',
        suggestions: recommendations?.suggestions || [],
        recentTopics: recommendations?.recentTopics || [],

        // Actions
        loadProfile,
        loadRecommendations,
        updateLearningStyle,
        updatePreferences,

        // Helpers
        getAdaptiveDifficulty,
        isInterestedIn,
    };

    return (
        <PersonalizationContext.Provider value={value}>
            {children}
        </PersonalizationContext.Provider>
    );
}

export default PersonalizationContext;
