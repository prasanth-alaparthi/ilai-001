import apiClient from '../api/axios';

/**
 * Study Search Service - API client for unified educational search
 */
const studySearchService = {
    /**
     * Unified search across local notes and web sources
     */
    search: async (query, options = {}) => {
        const params = new URLSearchParams({
            q: query,
            local: options.includeLocal !== false,
            limit: options.limit || 30
        });

        if (options.sources && options.sources.length > 0) {
            params.append('sources', options.sources.join(','));
        }
        if (options.subjects && options.subjects.length > 0) {
            params.append('subjects', options.subjects.join(','));
        }

        const response = await apiClient.get(`/ai/study/search?${params}`);
        return response.data;
    },

    /**
     * Get all enabled sources
     */
    getSources: async () => {
        const response = await apiClient.get('/ai/study/sources');
        return response.data;
    },

    /**
     * Get all enabled categories
     */
    getCategories: async () => {
        const response = await apiClient.get('/ai/study/categories');
        return response.data;
    },

    /**
     * Add new source (admin)
     */
    addSource: async (source) => {
        const response = await apiClient.post('/ai/study/sources', source);
        return response.data;
    },

    /**
     * Update source (admin)
     */
    updateSource: async (id, source) => {
        const response = await apiClient.put(`/ai/study/sources/${id}`, source);
        return response.data;
    },

    /**
     * Toggle source enabled status (admin)
     */
    toggleSource: async (id) => {
        const response = await apiClient.patch(`/ai/study/sources/${id}/toggle`);
        return response.data;
    },

    /**
     * Delete source (admin)
     */
    deleteSource: async (id) => {
        const response = await apiClient.delete(`/ai/study/sources/${id}`);
        return response.data;
    },

    /**
     * Add new category (admin)
     */
    addCategory: async (category) => {
        const response = await apiClient.post('/ai/study/categories', category);
        return response.data;
    },

    /**
     * Update category (admin)
     */
    updateCategory: async (id, category) => {
        const response = await apiClient.put(`/ai/study/categories/${id}`, category);
        return response.data;
    },

    /**
     * Toggle category enabled status (admin)
     */
    toggleCategory: async (id) => {
        const response = await apiClient.patch(`/ai/study/categories/${id}/toggle`);
        return response.data;
    }
};

export default studySearchService;
