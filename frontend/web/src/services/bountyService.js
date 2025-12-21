import apiClient from './apiClient';

/**
 * Bounty Service
 * Handles academic problem bounties and solution submissions.
 */
const bountyService = {
    /**
     * Get all open bounties.
     * @param {string} subject Optional subject filter
     * @param {string} search Optional search query
     */
    async getBounties(subject = null, search = null, page = 0, size = 20) {
        const params = { page, size };
        if (subject) params.subject = subject;
        if (search) params.search = search;

        const response = await apiClient.get('/bounties', { params });
        return response.data;
    },

    /**
     * Get trending bounties.
     */
    async getTrendingBounties(page = 0, size = 10) {
        const response = await apiClient.get('/bounties/trending', { params: { page, size } });
        return response.data;
    },

    /**
     * Get a single bounty by ID.
     */
    async getBounty(id) {
        const response = await apiClient.get(`/bounties/${id}`);
        return response.data;
    },

    /**
     * Create a new bounty.
     */
    async createBounty(request) {
        const response = await apiClient.post('/bounties', request);
        return response.data;
    },

    /**
     * Submit a solution attempt for a bounty.
     * @param {number} bountyId 
     * @param {object} payload { solutionNoteId, comment }
     */
    async submitSolution(bountyId, payload) {
        // Backend expects SubmitAttemptRequest which has noteId and optional comment
        const response = await apiClient.post(`/bounties/${bountyId}/attempts`, {
            noteId: payload.solutionNoteId,
            comment: payload.comment || "Bounty submission"
        });
        return response.data;
    },

    /**
     * Accept a solution (by bounty creator).
     */
    async acceptSolution(bountyId, attemptId) {
        const response = await apiClient.post(`/bounties/${bountyId}/attempts/${attemptId}/accept`);
        return response.data;
    },

    /**
     * Get user's created bounties.
     */
    async getMyCreatedBounties() {
        const response = await apiClient.get('/bounties/mine/created');
        return response.data;
    },

    /**
     * Get user's solved bounties.
     */
    async getMySolvedBounties() {
        const response = await apiClient.get('/bounties/mine/solved');
        return response.data;
    }
};

export default bountyService;
