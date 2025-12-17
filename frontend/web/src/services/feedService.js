import apiClient from './apiClient';

const feedService = {
    // ==================== Feed APIs ====================

    // Get personalized NeuroFeed
    async getFeed(limit = 20, offset = 0) {
        const response = await apiClient.get(`/feed`, { params: { limit, offset } });
        return response.data;
    },

    // Get trending posts
    async getTrending(limit = 20) {
        const response = await apiClient.get(`/feed/trending`, { params: { limit } });
        return response.data;
    },

    // Get posts from following
    async getFollowingFeed(limit = 20) {
        const response = await apiClient.get(`/feed/following`, { params: { limit } });
        return response.data;
    },

    // Get posts by hashtag
    async getByHashtag(tag, limit = 20) {
        const response = await apiClient.get(`/feed/hashtag/${tag}`, { params: { limit } });
        return response.data;
    },

    // Get saved posts
    async getSaved(collection = null) {
        const params = collection ? { collection } : {};
        const response = await apiClient.get(`/feed/saved`, { params });
        return response.data;
    },

    // Create new post
    async createPost(postData) {
        const response = await apiClient.post(`/feed/posts`, postData);
        return response.data;
    },

    // ==================== Engagement APIs ====================

    // Track engagement (invisible)
    async trackEngagement(postId, eventType, timeSpentSeconds = null, scrollDepth = null) {
        await apiClient.post(`/feed/posts/${postId}/engage`, {
            eventType,
            timeSpentSeconds,
            scrollDepth
        });
    },

    // Like post
    async likePost(postId) {
        const response = await apiClient.post(`/feed/posts/${postId}/like`);
        return response.data;
    },

    // Unlike post
    async unlikePost(postId) {
        const response = await apiClient.delete(`/feed/posts/${postId}/like`);
        return response.data;
    },

    // Save post
    async savePost(postId, collection = 'default') {
        const response = await apiClient.post(`/feed/posts/${postId}/save`, null, {
            params: { collection }
        });
        return response.data;
    },

    // Unsave post
    async unsavePost(postId) {
        const response = await apiClient.delete(`/feed/posts/${postId}/save`);
        return response.data;
    },

    // ==================== Hashtag APIs ====================

    async getTrendingHashtags(limit = 20) {
        const response = await apiClient.get(`/hashtags/trending`, { params: { limit } });
        return response.data;
    },

    async suggestHashtags(query, limit = 10) {
        const response = await apiClient.get(`/hashtags/suggest`, { params: { q: query, limit } });
        return response.data;
    }
};

export default feedService;
