import apiClient from './apiClient';

/**
 * Free Search Service - No AI costs
 */
const freeSearchService = {
    /**
     * Unified search across notes and feed
     */
    search: async (query, options = {}) => {
        const params = new URLSearchParams({
            q: query,
            limit: options.limit || 20,
            notes: options.notes !== false,
            feed: options.feed !== false
        });

        const response = await apiClient.get(`/api/search/free?${params}`);
        return response.data;
    },

    /**
     * Quick search (notes only)
     */
    quickSearch: async (query, limit = 10) => {
        const response = await apiClient.get(`/api/search/free/quick?q=${encodeURIComponent(query)}&limit=${limit}`);
        return response.data;
    }
};

/**
 * FSRS Flashcard Service - Spaced repetition
 */
const flashcardService = {
    /**
     * Get cards due for review
     */
    getDueCards: async () => {
        const response = await apiClient.get('/api/flashcards/due');
        return response.data;
    },

    /**
     * Submit a review
     * @param flashcardId - UUID of the flashcard
     * @param rating - 1=Again, 2=Hard, 3=Good, 4=Easy
     */
    submitReview: async (flashcardId, rating) => {
        const response = await apiClient.post(`/api/flashcards/${flashcardId}/review`, { rating });
        return response.data;
    },

    /**
     * Get study statistics
     */
    getStats: async () => {
        const response = await apiClient.get('/api/flashcards/stats');
        return response.data;
    },

    /**
     * Get study forecast
     */
    getForecast: async () => {
        const response = await apiClient.get('/api/flashcards/forecast');
        return response.data;
    }
};

/**
 * Rating constants for FSRS
 */
export const RATINGS = {
    AGAIN: 1,  // Complete blackout
    HARD: 2,   // Struggled but got it
    GOOD: 3,   // Correct with effort
    EASY: 4    // Instant recall
};

export { freeSearchService, flashcardService };
export default freeSearchService;
