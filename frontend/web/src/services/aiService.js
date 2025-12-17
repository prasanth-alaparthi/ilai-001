import apiClient from "./apiClient";

/**
 * AI Service - Centralized AI functions
 * All AI requests now go through the muse-ai-service
 */
export const aiService = {
    // ============== Text Processing ==============

    async summarize(content) {
        const res = await apiClient.post("/ai/summarize", { content });
        return res.data.summary;
    },

    async explain(content, level = "easy") {
        const res = await apiClient.post("/ai/explain", { content, level });
        return res.data.explanation;
    },

    async grammarCheck(text) {
        const res = await apiClient.post("/ai/grammar-check", { text });
        return res.data.result;
    },

    async generate(prompt, systemInstruction = null) {
        const res = await apiClient.post("/ai/generate", {
            prompt,
            systemInstruction
        });
        return res.data.result;
    },

    // ============== Study Tools ==============

    async generateFlashcards(content) {
        const res = await apiClient.post("/ai/flashcards", { content });
        return res.data.flashcards;
    },

    async generateQuiz(content) {
        const res = await apiClient.post("/ai/generate-quiz", { content });
        return res.data.quiz;
    },

    // ============== Assistant ==============

    async quickChat(message) {
        const res = await apiClient.post("/assistant/quick-chat", { message });
        return res.data.response;
    },

    async startConversation(title, contextType = "general", contextId = null) {
        const res = await apiClient.post("/assistant/conversations", {
            title,
            contextType,
            contextId
        });
        return res.data;
    },

    async getConversations() {
        const res = await apiClient.get("/assistant/conversations");
        return res.data;
    },

    async getMessages(conversationId) {
        const res = await apiClient.get(`/assistant/conversations/${conversationId}/messages`);
        return res.data;
    },

    async chat(conversationId, message) {
        const res = await apiClient.post(`/assistant/conversations/${conversationId}/chat`, {
            message
        });
        return res.data;
    },

    async deleteConversation(conversationId) {
        await apiClient.delete(`/assistant/conversations/${conversationId}`);
    },

    // ============== Personalization ==============

    async getProfile() {
        const res = await apiClient.get("/personalization/profile");
        return res.data;
    },

    async getRecommendations() {
        const res = await apiClient.get("/personalization/recommendations");
        return res.data;
    },

    async updateLearningStyle(style) {
        await apiClient.put("/personalization/learning-style", { style });
    },

    async updatePreferences(preferences) {
        await apiClient.put("/personalization/preferences", preferences);
    },

    // ============== Unified Search ==============

    async unifiedSearch(query, limit = 10) {
        const res = await apiClient.get("/search/unified", {
            params: { q: query, limit }
        });
        return res.data;
    },

    async smartSearch(query) {
        const res = await apiClient.get("/search/smart", {
            params: { q: query }
        });
        return res.data;
    },

    async getRelatedContent(contentId, contentType) {
        const res = await apiClient.get("/search/related", {
            params: { contentId, contentType }
        });
        return res.data;
    },

    async searchByType(type, query, limit = 10) {
        const res = await apiClient.get(`/search/${type}`, {
            params: { q: query, limit }
        });
        return res.data;
    },

    // ============== Deep Research ==============

    async deepResearch(topic, depth = 'deep') {
        const res = await apiClient.post("/research/deep", {
            query: topic,  // Backend expects 'query' not 'topic'
            depth
        });
        return res.data;
    },

    async getResearchHistory() {
        const res = await apiClient.get("/research/stats");  // Use stats endpoint as history proxy
        return res.data;
    },

    async generateStudyGuide(noteId, topic = 'General') {
        const res = await apiClient.post("/notebook/study-guide", {
            topic,
            noteIds: [noteId.toString()]  // Backend expects noteIds array
        });
        return res.data;
    },

    async generateMindMap(noteId, content = '') {
        const res = await apiClient.post("/notebook/mind-map", {
            content,
            centralTopic: noteId.toString()  // Use noteId as topic reference
        });
        return res.data;
    },

    async generateAudioOverview(noteId, content = '') {
        const res = await apiClient.post("/notebook/podcast-script", {
            content,
            topic: noteId.toString()  // Use noteId as topic reference
        });
        return res.data;
    },

    // ============== Agents (Coming Soon) ==============

    async createAgent(type, goal, tools = []) {
        const res = await apiClient.post("/agents", { type, goal, tools });
        return res.data;
    },

    async getAgentStatus(agentId) {
        const res = await apiClient.get(`/agents/${agentId}`);
        return res.data;
    },

    async getActiveAgents() {
        const res = await apiClient.get("/agents/active");
        return res.data;
    }
};

export default aiService;

