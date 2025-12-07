import apiClient from "./apiClient";

export const authService = {
    async login(username, password) {
        const response = await apiClient.post("/auth/authenticate", { username, password });
        return response.data;
    },

    async register(data) {
        const response = await apiClient.post("/auth/register", data);
        return response.data;
    },

    async getMe() {
        const response = await apiClient.get("/auth/me");
        return response.data;
    },

    async logout() {
        try {
            await apiClient.post("/auth/logout");
        } catch (error) {
            console.error("Logout failed", error);
        }
        return true;
    },

    async verifyEmail(token) {
        // Backend expects GET for verification
        const response = await apiClient.get(`/auth/verify-email?token=${token}`);
        return response.data;
    },

    async forgotPassword(email) {
        // Backend expects 'identifier' field, not 'email'
        const response = await apiClient.post("/auth/forgot-password", { identifier: email });
        return response.data;
    },

    async resetPassword(token, newPassword) {
        const response = await apiClient.post("/auth/reset-password", { token, newPassword });
        return response.data;
    }
};
