import apiClient from './apiClient';

/**
 * Labs Service - Interactive learning labs
 * Connects to muse-notes-service at /api/labs
 */
const labsService = {
    // ==================== Lab CRUD ====================

    // Get all labs (optionally filtered by subject)
    async getAllLabs(subject = null) {
        const params = subject ? { subject } : {};
        const response = await apiClient.get('/labs', { params });
        return response.data;
    },

    // Get labs by subject/category
    async getLabsBySubject(subject) {
        const response = await apiClient.get('/labs', { params: { subject } });
        return response.data;
    },

    // Get single lab by ID
    async getLabById(labId) {
        const response = await apiClient.get(`/labs/${labId}`);
        return response.data;
    },

    // Create a new lab (admin only)
    async createLab(labData) {
        const response = await apiClient.post('/labs', labData);
        return response.data;
    },

    // ==================== Progress Tracking ====================

    // Mark lab as completed with quiz score
    async completeLab(labId, quizScore = null) {
        const response = await apiClient.post(`/labs/${labId}/complete`, {
            quizScore
        });
        return response.data;
    },

    // Get user's progress across all labs
    async getProgress() {
        const response = await apiClient.get('/labs/progress');
        return response.data;
    },

    // Get user's lab statistics (completed, in-progress, etc.)
    async getStats() {
        const response = await apiClient.get('/labs/stats');
        return response.data;
    },

    // Export lab simulation results
    async exportResult(labId) {
        const response = await apiClient.get(`/labs/${labId}/export`);
        return response.data;
    },

    // Save current lab session state
    async saveSession(labId, metadata, runtime = 0) {
        const response = await apiClient.post(`/labs/${labId}/save-session`, {
            metadataJson: JSON.stringify(metadata),
            runtime
        });
        return response.data;
    },

    // Load saved lab session state
    async getSession(labId) {
        try {
            const response = await apiClient.get(`/labs/${labId}/session`);
            if (response.data && response.data.metadataJson) {
                return JSON.parse(response.data.metadataJson);
            }
            return null;
        } catch (error) {
            return null; // Return null if no session exists or error
        }
    },

    // ==================== AI Features ====================

    // Solve equation using AI
    async solveEquation(equation) {
        const response = await apiClient.post('/labs/ai/solve', { equation });
        return response.data;
    },

    // Balance chemical reaction
    async balanceReaction(reaction) {
        const response = await apiClient.post('/labs/ai/balance', { reaction });
        return response.data;
    },

    // Explain scientific concept
    async explainConcept(concept) {
        const response = await apiClient.post('/labs/ai/explain', { concept });
        return response.data;
    },

    // ==================== Categories ====================

    CATEGORIES: [
        { id: 'MATH', name: 'Mathematics', icon: '📐' },
        { id: 'PHYSICS', name: 'Physics', icon: '⚡' },
        { id: 'CHEMISTRY', name: 'Chemistry', icon: '🧪' },
        { id: 'BIOLOGY', name: 'Biology', icon: '🧬' },
        { id: 'CS', name: 'Computer Science', icon: '💻' }
    ]
};

export default labsService;
