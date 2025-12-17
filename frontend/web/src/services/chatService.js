import apiClient from './apiClient';

/**
 * Chat Service - Real-time messaging functionality
 * Connects to muse-social-service at /api/chat
 */
const chatService = {
    // ==================== Conversations ====================

    // Create a new conversation
    async createConversation({ type = 'DIRECT', name = '', participantIds = [], contextType = null, contextId = null }) {
        const response = await apiClient.post('/chat/conversations', {
            type,
            name,
            participantIds,
            contextType,
            contextId
        });
        return response.data;
    },

    // Get user's conversations
    async getConversations(contextType = null, contextId = null) {
        const params = {};
        if (contextType) params.contextType = contextType;
        if (contextId) params.contextId = contextId;
        const response = await apiClient.get('/chat/conversations', { params });
        return response.data;
    },

    // Get messages in a conversation
    async getMessages(conversationId, page = 0, size = 50) {
        const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`, {
            params: { page, size }
        });
        return response.data;
    },

    // Send a message
    async sendMessage(conversationId, content, type = 'TEXT', mediaUrl = null, replyToId = null) {
        const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, {
            content,
            type,
            mediaUrl,
            replyToId
        });
        return response.data;
    },

    // ==================== Media ====================

    // Upload media for chat
    async uploadMedia(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/chat/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // ==================== WebSocket Helpers ====================

    // Get WebSocket connection URL
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws/chat`;
    }
};

export default chatService;
