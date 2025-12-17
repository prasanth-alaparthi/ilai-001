import apiClient from './apiClient';

/**
 * Parental Service - Parental control features (PIN lock)
 * Connects to muse-academic-service at /api/parental
 */
const parentalService = {
    // ==================== PIN Management ====================

    // Check if parental PIN is enabled
    async getStatus() {
        const response = await apiClient.get('/parental/pin/status');
        return response.data;
    },

    // Setup a new PIN
    async setupPin(pin) {
        const response = await apiClient.post('/parental/pin/setup', { pin });
        return response.data;
    },

    // Verify PIN
    async verifyPin(pin) {
        const response = await apiClient.post('/parental/pin/verify', { pin });
        return response.data;
    },

    // Remove PIN protection
    async removePin() {
        const response = await apiClient.post('/parental/pin/remove');
        return response.data;
    },

    // ==================== Helper Methods ====================

    // Check if parental mode is currently locked
    isLocked() {
        return sessionStorage.getItem('parentalUnlocked') !== 'true';
    },

    // Unlock parental mode for session
    unlock() {
        sessionStorage.setItem('parentalUnlocked', 'true');
    },

    // Lock parental mode
    lock() {
        sessionStorage.removeItem('parentalUnlocked');
    }
};

export default parentalService;
