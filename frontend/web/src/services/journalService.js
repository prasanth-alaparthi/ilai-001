import apiClient from './apiClient';

/**
 * Journal Service - Daily learning journal entries
 * Connects to muse-notes-service at /api/journal
 */
const journalService = {
    // ==================== Journal Entries ====================

    // Get all journal entries
    async listEntries() {
        const response = await apiClient.get('/journal/entries');
        return response.data;
    },

    // Get single entry by ID
    async getEntry(entryId) {
        const response = await apiClient.get(`/journal/entries/${entryId}`);
        return response.data;
    },

    // Create a new journal entry
    async createEntry({ title = 'Untitled', contentJson = '', courseCode = '' }) {
        const response = await apiClient.post('/journal/entries', {
            title,
            contentJson,
            courseCode
        });
        return response.data;
    },

    // Update an existing entry
    async updateEntry(entryId, { title, contentJson, courseCode }) {
        const response = await apiClient.put(`/journal/entries/${entryId}`, {
            title,
            contentJson,
            courseCode
        });
        return response.data;
    },

    // Delete a journal entry
    async deleteEntry(entryId) {
        const response = await apiClient.delete(`/journal/entries/${entryId}`);
        return response.data;
    },

    // Submit entry for teacher review
    async submitEntry(entryId, courseCode, className = '') {
        const response = await apiClient.post(`/journal/entries/${entryId}/submit`, {
            courseCode,
            className
        });
        return response.data;
    },

    // ==================== Teacher Review ====================

    // Get pending submissions (for teachers)
    async getPendingSubmissions(courseCode = null) {
        const params = courseCode ? { courseCode } : {};
        const response = await apiClient.get('/journal/teacher/submissions', { params });
        return response.data;
    },

    // Review a submission
    async reviewSubmission(submissionId, feedback, score = null) {
        const response = await apiClient.post(`/journal/teacher/submissions/${submissionId}/review`, {
            feedback,
            score
        });
        return response.data;
    },

    // ==================== Publications ====================

    // Get published journals
    async getPublications() {
        const response = await apiClient.get('/journal/publications');
        return response.data;
    },

    // Publish a journal entry
    async publishEntry(entryId) {
        const response = await apiClient.post(`/journal/publications/${entryId}`);
        return response.data;
    },

    // ==================== Templates ====================

    // Get journal templates
    async getTemplates() {
        const response = await apiClient.get('/templates');
        return response.data;
    },

    // Create from template
    async createFromTemplate(templateId) {
        const response = await apiClient.post(`/templates/${templateId}/use`);
        return response.data;
    },

    // ==================== Audio ====================

    // Generate audio overview of entry
    async generateAudio(entryId) {
        const response = await apiClient.post(`/journals/${entryId}/audio`);
        return response.data;
    }
};

export default journalService;
