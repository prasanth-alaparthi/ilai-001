import apiClient from './apiClient';

const groupService = {
    // ==================== Group APIs ====================

    async createGroup(groupData) {
        const response = await apiClient.post(`/groups`, groupData);
        return response.data;
    },

    async getGroup(groupId) {
        const response = await apiClient.get(`/groups/${groupId}`);
        return response.data;
    },

    async joinGroup(groupId) {
        const response = await apiClient.post(`/groups/${groupId}/join`);
        return response.data;
    },

    async leaveGroup(groupId) {
        const response = await apiClient.post(`/groups/${groupId}/leave`);
        return response.data;
    },

    async getMyGroups() {
        const response = await apiClient.get(`/groups/my`);
        return response.data;
    },

    async discoverGroups(limit = 20) {
        const response = await apiClient.get(`/groups/discover`, { params: { limit } });
        return response.data;
    },

    async searchGroups(query, limit = 20) {
        const response = await apiClient.get(`/groups/search`, { params: { q: query, limit } });
        return response.data;
    },

    async getGroupMembers(groupId) {
        const response = await apiClient.get(`/groups/${groupId}/members`);
        return response.data;
    }
};

export default groupService;
