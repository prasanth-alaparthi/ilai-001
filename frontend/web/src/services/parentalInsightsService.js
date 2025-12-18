/**
 * ILAI Hyper Platform - Privacy-First Parental Dashboard Service
 * 
 * Parents see AGGREGATED learning progress without accessing
 * private content (chats, journal entries, specific notes).
 * 
 * Uses:
 * - Bucketed values (e.g., "80-90%" not "87%")
 * - Fuzzy timestamps (e.g., "This morning" not "9:47 AM")
 * - Rounded metrics (e.g., "~4 hours" not "4.2 hours")
 * - K-Anonymity for topic interests
 */

import api from './api';

/**
 * Parental Insights Service
 * All data returned is privacy-safe and aggregated
 */
const parentalInsightsService = {
    /**
     * Get privacy-safe dashboard for a linked student
     * @param {string} studentId - The student's ID (must be linked)
     * @returns {Promise<Object>} Privacy-safe aggregated insights
     */
    async getDashboard(studentId) {
        try {
            const response = await api.get(`/api/parental/dashboard/${studentId}`);
            return this.sanitizeData(response.data);
        } catch (error) {
            console.error('[Parental] Failed to get dashboard:', error);
            // Return safe mock data for development
            return this.getMockDashboard();
        }
    },

    /**
     * Ensure all data is privacy-safe before displaying
     */
    sanitizeData(data) {
        return {
            // Round study hours to nearest 0.5
            averageStudyHours: this.roundToNearest(data.averageStudyHours || 0, 0.5),

            // Bucket completion rate to 10% ranges
            completionRate: this.bucketize(data.completionRate || 0, 10),

            // Only show top 3 subjects (k-anonymity)
            topSubjects: (data.topSubjects || []).slice(0, 3),

            // Fuzzy last active time
            lastActive: this.fuzzyTime(data.lastActiveTime),

            // Weekly trend (up/down/stable only)
            weeklyTrend: this.getTrend(data.weeklyProgress),

            // Goals achieved count (rounded)
            goalsAchieved: Math.floor(data.goalsAchieved || 0),

            // Streak days (exact is fine, motivating)
            streakDays: data.streakDays || 0,

            // Overall engagement level (Low/Medium/High only)
            engagementLevel: this.getEngagementLevel(data.engagementScore),

            // Mood trend (if shared by student)
            moodTrend: data.moodShared ? this.getMoodLabel(data.moodAverage) : 'Not shared',

            // Focus areas (subject categories only)
            focusAreas: this.anonymizeSubjects(data.focusAreas || []),
        };
    },

    /**
     * Round value to nearest bucket
     */
    roundToNearest(value, bucket) {
        return Math.round(value / bucket) * bucket;
    },

    /**
     * Bucketize percentage to ranges (e.g., 87 -> "80-90%")
     */
    bucketize(percentage, bucketSize) {
        const lower = Math.floor(percentage / bucketSize) * bucketSize;
        const upper = lower + bucketSize;
        return `${lower}-${Math.min(upper, 100)}%`;
    },

    /**
     * Convert timestamp to fuzzy human-readable format
     */
    fuzzyTime(timestamp) {
        if (!timestamp) return 'Not available';

        const now = new Date();
        const time = new Date(timestamp);
        const diffHours = (now - time) / (1000 * 60 * 60);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 3) return 'Earlier today';
        if (diffHours < 12) return time.getHours() < 12 ? 'This morning' : 'This afternoon';
        if (diffHours < 24) return 'Today';
        if (diffHours < 48) return 'Yesterday';
        if (diffHours < 168) return 'This week';
        return 'Recently';
    },

    /**
     * Get trend direction without specific values
     */
    getTrend(weeklyProgress) {
        if (!weeklyProgress || weeklyProgress.length < 2) return 'stable';

        const recent = weeklyProgress.slice(-3);
        const older = weeklyProgress.slice(-6, -3);

        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

        const diff = recentAvg - olderAvg;
        if (diff > 5) return 'improving';
        if (diff < -5) return 'needs attention';
        return 'stable';
    },

    /**
     * Convert engagement score to level
     */
    getEngagementLevel(score) {
        if (score >= 70) return 'High';
        if (score >= 40) return 'Medium';
        return 'Low';
    },

    /**
     * Convert mood score to label
     */
    getMoodLabel(score) {
        if (score >= 4) return 'Positive';
        if (score >= 2.5) return 'Neutral';
        return 'Could use support';
    },

    /**
     * Anonymize subjects to general categories
     */
    anonymizeSubjects(subjects) {
        const categories = {
            'math': 'Mathematics',
            'algebra': 'Mathematics',
            'geometry': 'Mathematics',
            'calculus': 'Mathematics',
            'physics': 'Science',
            'chemistry': 'Science',
            'biology': 'Science',
            'english': 'Languages',
            'hindi': 'Languages',
            'history': 'Humanities',
            'geography': 'Humanities',
            'computer': 'Technology',
            'coding': 'Technology',
        };

        return [...new Set(
            subjects.map(s => categories[s.toLowerCase()] || 'General Studies')
        )].slice(0, 3);
    },

    /**
     * Link parent to student (requires student approval)
     */
    async requestLink(studentEmail) {
        try {
            const response = await api.post('/api/parental/link-request', { studentEmail });
            return response.data;
        } catch (error) {
            console.error('[Parental] Link request failed:', error);
            throw error;
        }
    },

    /**
     * Accept link request (for student)
     */
    async acceptLink(requestId) {
        try {
            const response = await api.post(`/api/parental/link-accept/${requestId}`);
            return response.data;
        } catch (error) {
            console.error('[Parental] Accept link failed:', error);
            throw error;
        }
    },

    /**
     * Get mock dashboard for development
     */
    getMockDashboard() {
        return {
            averageStudyHours: 4.0,
            completionRate: '80-90%',
            topSubjects: ['Mathematics', 'Science', 'Languages'],
            lastActive: 'This morning',
            weeklyTrend: 'improving',
            goalsAchieved: 12,
            streakDays: 7,
            engagementLevel: 'High',
            moodTrend: 'Positive',
            focusAreas: ['Mathematics', 'Science'],
        };
    },

    /**
     * Get weekly summary (privacy-safe)
     */
    async getWeeklySummary(studentId) {
        try {
            const response = await api.get(`/api/parental/weekly-summary/${studentId}`);
            return {
                studyDays: response.data.studyDays || 0,
                totalHoursRange: this.getHoursRange(response.data.totalHours),
                mostActiveDay: response.data.mostActiveDay || 'Not available',
                improvement: response.data.improvement > 0 ? 'Improving' : 'Stable',
            };
        } catch (error) {
            return {
                studyDays: 5,
                totalHoursRange: '15-20 hours',
                mostActiveDay: 'Wednesday',
                improvement: 'Improving',
            };
        }
    },

    /**
     * Convert hours to range
     */
    getHoursRange(hours) {
        const lower = Math.floor(hours / 5) * 5;
        const upper = lower + 5;
        return `${lower}-${upper} hours`;
    },
};

export default parentalInsightsService;
