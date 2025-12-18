/**
 * ILAI Hyper Platform - Background Learning Service
 * 
 * Silent AI that observes user behavior and learns preferences
 * WITHOUT any user interaction or API calls.
 * 
 * Runs in Web Worker for non-blocking operation.
 * Stores learning profile in IndexedDB.
 * Influences agentic AI prompts with user context.
 */

import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'ilai-learning';
const DB_VERSION = 1;

// Stores
const STORES = {
    EVENTS: 'learning-events',
    PROFILE: 'user-profile',
    PATTERNS: 'detected-patterns',
    PREFERENCES: 'preferences'
};

/**
 * Initialize the learning database
 */
async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Event store for raw observations
            if (!db.objectStoreNames.contains(STORES.EVENTS)) {
                const eventStore = db.createObjectStore(STORES.EVENTS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                eventStore.createIndex('type', 'type');
                eventStore.createIndex('timestamp', 'timestamp');
                eventStore.createIndex('subject', 'subject');
            }

            // User profile (aggregated insights)
            if (!db.objectStoreNames.contains(STORES.PROFILE)) {
                db.createObjectStore(STORES.PROFILE, { keyPath: 'key' });
            }

            // Detected patterns
            if (!db.objectStoreNames.contains(STORES.PATTERNS)) {
                const patternStore = db.createObjectStore(STORES.PATTERNS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                patternStore.createIndex('type', 'type');
            }

            // Preferences (inferred settings)
            if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
                db.createObjectStore(STORES.PREFERENCES, { keyPath: 'key' });
            }
        }
    });
}

/**
 * Background Learning Service
 */
class BackgroundLearningService {
    constructor() {
        this.db = null;
        this.sessionStart = Date.now();
        this.currentTopic = null;
        this.observers = [];
    }

    /**
     * Initialize the service
     */
    async init() {
        this.db = await initDB();
        console.log('[Learning] Background learning service initialized');

        // Start periodic analysis
        this.startPeriodicAnalysis();

        return this;
    }

    // ==========================================
    // OBSERVATION METHODS (Silent Data Collection)
    // ==========================================

    /**
     * Track note viewing/editing
     */
    async trackNoteActivity(noteId, action, metadata = {}) {
        await this.recordEvent('note', action, {
            noteId,
            subject: metadata.subject || this.currentTopic,
            duration: metadata.duration,
            wordCount: metadata.wordCount,
            ...metadata
        });
    }

    /**
     * Track quiz/flashcard performance
     */
    async trackQuizPerformance(quizId, result, metadata = {}) {
        await this.recordEvent('quiz', result.correct ? 'correct' : 'incorrect', {
            quizId,
            subject: metadata.subject,
            topic: metadata.topic,
            difficulty: metadata.difficulty,
            timeSpent: metadata.timeSpent,
            attempts: metadata.attempts
        });

        // Update topic strength
        await this.updateTopicStrength(metadata.topic, result.correct);
    }

    /**
     * Track study session
     */
    async trackStudySession(subject, duration, metadata = {}) {
        await this.recordEvent('study', 'session', {
            subject,
            duration,
            startTime: metadata.startTime,
            endTime: metadata.endTime,
            focusScore: metadata.focusScore
        });

        // Update preferred study times
        await this.updateStudyTimePattern(metadata.startTime);
    }

    /**
     * Track search queries
     */
    async trackSearch(query, results = []) {
        await this.recordEvent('search', 'query', {
            query,
            resultCount: results.length,
            clicked: results.filter(r => r.clicked).map(r => r.id)
        });
    }

    /**
     * Track content engagement
     */
    async trackEngagement(contentId, type, data = {}) {
        await this.recordEvent('engagement', type, {
            contentId,
            scrollDepth: data.scrollDepth,
            timeOnPage: data.timeOnPage,
            interactions: data.interactions
        });
    }

    /**
     * Record any event to the database
     */
    async recordEvent(category, action, data = {}) {
        if (!this.db) await this.init();

        const event = {
            category,
            action,
            data,
            timestamp: Date.now(),
            sessionId: this.sessionStart,
            subject: data.subject || this.currentTopic
        };

        await this.db.add(STORES.EVENTS, event);
    }

    // ==========================================
    // ANALYSIS METHODS (Pattern Detection)
    // ==========================================

    /**
     * Start periodic background analysis
     */
    startPeriodicAnalysis() {
        // Run analysis every 5 minutes
        setInterval(() => this.runAnalysis(), 5 * 60 * 1000);

        // Run initial analysis after 30 seconds
        setTimeout(() => this.runAnalysis(), 30 * 1000);
    }

    /**
     * Run full analysis pipeline
     */
    async runAnalysis() {
        console.log('[Learning] Running background analysis...');

        try {
            await Promise.all([
                this.analyzeTopicStrengths(),
                this.analyzeStudyPatterns(),
                this.analyzePreferences(),
                this.detectWeakAreas()
            ]);

            console.log('[Learning] Analysis complete');
        } catch (error) {
            console.error('[Learning] Analysis failed:', error);
        }
    }

    /**
     * Analyze topic strengths from quiz performance
     */
    async analyzeTopicStrengths() {
        const events = await this.getEvents('quiz', 100);

        const topicStats = {};

        for (const event of events) {
            const topic = event.data.topic || 'general';
            if (!topicStats[topic]) {
                topicStats[topic] = { correct: 0, total: 0 };
            }
            topicStats[topic].total++;
            if (event.action === 'correct') {
                topicStats[topic].correct++;
            }
        }

        // Calculate strengths
        const strengths = {};
        for (const [topic, stats] of Object.entries(topicStats)) {
            strengths[topic] = stats.total > 0
                ? Math.round((stats.correct / stats.total) * 100)
                : 50;
        }

        await this.updateProfile('topicStrengths', strengths);
    }

    /**
     * Analyze study time patterns
     */
    async analyzeStudyPatterns() {
        const events = await this.getEvents('study', 50);

        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Array(7).fill(0);
        let totalDuration = 0;

        for (const event of events) {
            if (event.data.startTime) {
                const date = new Date(event.data.startTime);
                hourCounts[date.getHours()]++;
                dayCounts[date.getDay()]++;
            }
            totalDuration += event.data.duration || 0;
        }

        // Find peak hours
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

        await this.updateProfile('studyPatterns', {
            peakHour,
            peakDay,
            averageSessionMinutes: events.length > 0
                ? Math.round(totalDuration / events.length / 60)
                : 30,
            totalSessions: events.length
        });
    }

    /**
     * Analyze user preferences
     */
    async analyzePreferences() {
        const noteEvents = await this.getEvents('note', 50);
        const engagementEvents = await this.getEvents('engagement', 50);

        // Content length preference
        const wordCounts = noteEvents
            .map(e => e.data.wordCount)
            .filter(Boolean);

        const avgWordCount = wordCounts.length > 0
            ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
            : 500;

        // Engagement preference
        const avgScrollDepth = engagementEvents
            .map(e => e.data.scrollDepth)
            .filter(Boolean)
            .reduce((a, b, _, arr) => a + b / arr.length, 0) || 50;

        await this.updateProfile('preferences', {
            preferredContentLength: avgWordCount < 300 ? 'short' : avgWordCount > 800 ? 'long' : 'medium',
            engagementStyle: avgScrollDepth > 80 ? 'thorough' : avgScrollDepth > 50 ? 'moderate' : 'skimmer',
            lastUpdated: Date.now()
        });
    }

    /**
     * Detect weak areas that need attention
     */
    async detectWeakAreas() {
        const profile = await this.getProfile('topicStrengths');
        if (!profile?.value) return;

        const weakAreas = Object.entries(profile.value)
            .filter(([_, strength]) => strength < 60)
            .sort((a, b) => a[1] - b[1])
            .slice(0, 5)
            .map(([topic, strength]) => ({ topic, strength }));

        await this.updateProfile('weakAreas', weakAreas);
    }

    /**
     * Update topic strength based on quiz result
     */
    async updateTopicStrength(topic, isCorrect) {
        if (!topic) return;

        const profile = await this.getProfile('topicStrengths');
        const strengths = profile?.value || {};

        const current = strengths[topic] || 50;
        // Exponential moving average
        const delta = isCorrect ? 5 : -8;
        strengths[topic] = Math.max(0, Math.min(100, current + delta));

        await this.updateProfile('topicStrengths', strengths);
    }

    /**
     * Update study time patterns
     */
    async updateStudyTimePattern(timestamp) {
        if (!timestamp) return;

        const date = new Date(timestamp);
        const hour = date.getHours();

        const profile = await this.getProfile('studyHours');
        const hours = profile?.value || {};

        hours[hour] = (hours[hour] || 0) + 1;
        await this.updateProfile('studyHours', hours);
    }

    // ==========================================
    // PROFILE ACCESS (For AI Context)
    // ==========================================

    /**
     * Get learning context for AI prompts
     * This is what enhances the agentic AI
     */
    async getLearningContext() {
        const [
            topicStrengths,
            weakAreas,
            preferences,
            studyPatterns
        ] = await Promise.all([
            this.getProfile('topicStrengths'),
            this.getProfile('weakAreas'),
            this.getProfile('preferences'),
            this.getProfile('studyPatterns')
        ]);

        return {
            strengths: topicStrengths?.value || {},
            weakAreas: weakAreas?.value || [],
            preferences: preferences?.value || {},
            studyPatterns: studyPatterns?.value || {},

            // Pre-formatted context for AI prompts
            promptContext: this.formatForPrompt({
                strengths: topicStrengths?.value,
                weakAreas: weakAreas?.value,
                preferences: preferences?.value
            })
        };
    }

    /**
     * Format learning profile for AI prompts
     */
    formatForPrompt({ strengths, weakAreas, preferences }) {
        const lines = [];

        if (weakAreas?.length > 0) {
            const topics = weakAreas.map(w => w.topic).join(', ');
            lines.push(`Student needs help with: ${topics}`);
        }

        if (strengths) {
            const strong = Object.entries(strengths)
                .filter(([_, s]) => s >= 80)
                .map(([t]) => t);
            if (strong.length > 0) {
                lines.push(`Strong in: ${strong.join(', ')}`);
            }
        }

        if (preferences?.preferredContentLength) {
            lines.push(`Prefers ${preferences.preferredContentLength} explanations`);
        }

        if (preferences?.engagementStyle) {
            lines.push(`Learning style: ${preferences.engagementStyle}`);
        }

        return lines.length > 0
            ? `[User Profile]\n${lines.join('\n')}`
            : '';
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    async getEvents(category, limit = 100) {
        if (!this.db) await this.init();

        const tx = this.db.transaction(STORES.EVENTS, 'readonly');
        const store = tx.objectStore(STORES.EVENTS);
        const index = store.index('timestamp');

        const events = [];
        let cursor = await index.openCursor(null, 'prev');

        while (cursor && events.length < limit) {
            if (!category || cursor.value.category === category) {
                events.push(cursor.value);
            }
            cursor = await cursor.continue();
        }

        return events;
    }

    async getProfile(key) {
        if (!this.db) await this.init();
        return this.db.get(STORES.PROFILE, key);
    }

    async updateProfile(key, value) {
        if (!this.db) await this.init();
        await this.db.put(STORES.PROFILE, { key, value, updated: Date.now() });
    }

    /**
     * Set current topic context
     */
    setCurrentTopic(topic) {
        this.currentTopic = topic;
    }

    /**
     * Clear all learning data
     */
    async clearAllData() {
        if (!this.db) await this.init();

        const tx = this.db.transaction(
            [STORES.EVENTS, STORES.PROFILE, STORES.PATTERNS, STORES.PREFERENCES],
            'readwrite'
        );

        await Promise.all([
            tx.objectStore(STORES.EVENTS).clear(),
            tx.objectStore(STORES.PROFILE).clear(),
            tx.objectStore(STORES.PATTERNS).clear(),
            tx.objectStore(STORES.PREFERENCES).clear()
        ]);

        console.log('[Learning] All learning data cleared');
    }
}

// Singleton instance
let learningService = null;

/**
 * Get or create the learning service instance
 */
export async function getLearningService() {
    if (!learningService) {
        learningService = new BackgroundLearningService();
        await learningService.init();
    }
    return learningService;
}

export default BackgroundLearningService;
