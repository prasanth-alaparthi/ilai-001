import apiClient from "./apiClient";

/**
 * Agent Service - Manages AI agents and personal assistant
 */
export const agentService = {
    // ============== Personal Assistant ==============

    /**
     * Send a message to the personal assistant
     * The assistant will analyze your request and create appropriate agents
     */
    async askAssistant(message) {
        const res = await apiClient.post("/agents/assistant", { message });
        return res.data;
    },

    // ============== Agent Templates ==============

    /**
     * Get all available agent templates
     */
    async getTemplates() {
        const res = await apiClient.get("/agents/templates");
        return res.data;
    },

    // ============== Agent Management ==============

    /**
     * Create an agent from a template
     * @param {string} type - RESEARCH, NOTES, QUIZ, SCHEDULE, TUTOR, FLASHCARD, SUMMARY, WRITING, CUSTOM
     * @param {string} goal - What you want the agent to accomplish
     * @param {object} config - Optional configuration overrides
     */
    async createAgent(type, goal, config = {}) {
        const res = await apiClient.post("/agents", { type, goal, config });
        return res.data;
    },

    /**
     * Create a custom agent with specific tools
     */
    async createCustomAgent(goal, tools) {
        const res = await apiClient.post("/agents/custom", { goal, tools });
        return res.data;
    },

    /**
     * Execute an agent
     */
    async executeAgent(agentId) {
        const res = await apiClient.post(`/agents/${agentId}/execute`);
        return res.data;
    },

    /**
     * Get agent status and progress
     */
    async getAgentStatus(agentId) {
        const res = await apiClient.get(`/agents/${agentId}/status`);
        return res.data;
    },

    /**
     * Cancel a running agent
     */
    async cancelAgent(agentId) {
        const res = await apiClient.post(`/agents/${agentId}/cancel`);
        return res.data;
    },

    /**
     * Get all active agents for current user
     */
    async getActiveAgents() {
        const res = await apiClient.get("/agents/active");
        return res.data;
    },

    /**
     * Get agent history
     */
    async getAgentHistory(limit = 10) {
        const res = await apiClient.get("/agents/history", { params: { limit } });
        return res.data;
    },

    // ============== SSE Streaming ==============

    /**
     * Subscribe to real-time agent updates via Server-Sent Events
     * @param {string} agentId - Agent ID to subscribe to
     * @param {function} onMessage - Callback for updates
     * @param {function} onError - Callback for errors
     * @returns {EventSource} - The event source to close when done
     */
    subscribeToAgent(agentId, onMessage, onError) {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('token');
        const url = `${baseUrl}/api/agents/${agentId}/stream?token=${token}`;

        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (e) {
                onMessage({ message: event.data });
            }
        };

        eventSource.addEventListener('progress', (event) => {
            onMessage({ type: 'progress', ...JSON.parse(event.data) });
        });

        eventSource.addEventListener('result', (event) => {
            onMessage({ type: 'result', ...JSON.parse(event.data) });
            eventSource.close();
        });

        eventSource.addEventListener('error', (event) => {
            onMessage({ type: 'error', message: 'Agent processing failed' });
            eventSource.close();
        });

        eventSource.onerror = (error) => {
            if (onError) onError(error);
            eventSource.close();
        };

        return eventSource;
    },

    /**
     * Subscribe to all active agent updates
     */
    subscribeToAllAgents(userId, onMessage, onError) {
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('token');
        const url = `${baseUrl}/api/agents/stream/all?token=${token}`;

        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (e) {
                console.error('Failed to parse SSE message:', e);
            }
        };

        eventSource.onerror = (error) => {
            if (onError) onError(error);
        };

        return eventSource;
    },

    // ============== Tool Registry ==============

    /**
     * Get all available agent tools
     */
    async getTools() {
        const res = await apiClient.get("/agents/tools");
        return res.data;
    },

    /**
     * Get tools by category
     */
    async getToolsByCategory(category) {
        const res = await apiClient.get(`/agents/tools/${category}`);
        return res.data;
    },

    // ============== Quick Agent Actions ==============

    /**
     * Quick action: Research a topic
     */
    async research(topic) {
        return this.askAssistant(`Research: ${topic}`);
    },

    /**
     * Quick action: Summarize content
     */
    async summarize(content) {
        return this.askAssistant(`Summarize this: ${content}`);
    },

    /**
     * Quick action: Create a quiz
     */
    async createQuiz(topic) {
        return this.askAssistant(`Create a quiz about: ${topic}`);
    },

    /**
     * Quick action: Plan study session
     */
    async planStudy(topic, deadline) {
        return this.askAssistant(`Plan study sessions for ${topic}, deadline: ${deadline}`);
    },

    /**
     * Quick action: Explain concept
     */
    async explain(concept) {
        return this.askAssistant(`Explain this concept: ${concept}`);
    },

    /**
     * Quick action: Create flashcards
     */
    async createFlashcards(topic) {
        return this.askAssistant(`Create flashcards for: ${topic}`);
    }
};

export default agentService;
