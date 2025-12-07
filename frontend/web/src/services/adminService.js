import apiClient from "./apiClient";

export const adminService = {
    async getAllUsers() {
        const response = await apiClient.get("/auth/admin/users");
        return response.data;
    },

    async updateUserRole(userId, newRole) {
        const response = await apiClient.put(`/auth/admin/users/${userId}/role?role=${newRole}`);
        return response.data;
    },

    async approveStudentInstitution(userId) {
        const response = await apiClient.post(`/auth/admin/students/${userId}/approve-institution`);
        return response.data;
    }
};
