import apiClient from './apiClient';

const socialService = {
    // ==================== Follow APIs ====================

    async follow(userId) {
        const response = await apiClient.post(`/social/follow/${userId}`);
        return response.data;
    },

    async unfollow(userId) {
        const response = await apiClient.delete(`/social/follow/${userId}`);
        return response.data;
    },

    async getFollowing() {
        const response = await apiClient.get(`/social/following`);
        return response.data;
    },

    async getFollowers() {
        const response = await apiClient.get(`/social/followers`);
        return response.data;
    },

    // ==================== Friend Request APIs ====================

    async sendFriendRequest(userId, message = null) {
        const params = message ? { message } : {};
        const response = await apiClient.post(`/social/friend-request/${userId}`, null, { params });
        return response.data;
    },

    async acceptFriendRequest(requestId) {
        const response = await apiClient.post(`/social/friend-request/${requestId}/accept`);
        return response.data;
    },

    async declineFriendRequest(requestId) {
        const response = await apiClient.post(`/social/friend-request/${requestId}/decline`);
        return response.data;
    },

    async getPendingRequests() {
        const response = await apiClient.get(`/social/friend-requests/pending`);
        return response.data;
    },

    // ==================== Profile APIs ====================

    async getProfile(userId) {
        const response = await apiClient.get(`/social/profile/${userId}`);
        return response.data;
    },

    async updateProfile(profileData) {
        const response = await apiClient.put(`/social/profile`, profileData);
        return response.data;
    },

    async searchProfiles(query, limit = 20) {
        const response = await apiClient.get(`/social/search`, { params: { q: query, limit } });
        return response.data;
    }
};

export default socialService;
