import apiClient from './apiClient';

/**
 * Classroom Service - Virtual classroom management
 * Connects to muse-academic-service at /api/classrooms
 */
const classroomService = {
    // ==================== Classroom CRUD ====================

    // Get all classrooms
    async getAllClassrooms() {
        const response = await apiClient.get('/classrooms');
        return response.data;
    },

    // Get classroom by ID
    async getClassroomById(classroomId) {
        const response = await apiClient.get(`/classrooms/${classroomId}`);
        return response.data;
    },

    // Create a new classroom
    async createClassroom(classroomData) {
        const response = await apiClient.post('/classrooms', classroomData);
        return response.data;
    },

    // Update classroom
    async updateClassroom(classroomId, classroomData) {
        const response = await apiClient.put(`/classrooms/${classroomId}`, classroomData);
        return response.data;
    },

    // Delete classroom
    async deleteClassroom(classroomId) {
        const response = await apiClient.delete(`/classrooms/${classroomId}`);
        return response.data;
    },

    // ==================== Online Classes ====================

    // Get online classes for a classroom
    async getOnlineClasses(classroomId) {
        const response = await apiClient.get(`/classrooms/${classroomId}/online-classes`);
        return response.data;
    },

    // Start a live class
    async startOnlineClass(classroomId, title) {
        const response = await apiClient.post(`/classrooms/${classroomId}/start-class`, {
            title
        });
        return response.data;
    },

    // End a live class
    async endOnlineClass(onlineClassId) {
        const response = await apiClient.post(`/classrooms/online-classes/${onlineClassId}/end`);
        return response.data;
    },

    // ==================== Students ====================

    // Get students in a classroom
    async getStudents(classroomId) {
        const response = await apiClient.get(`/classrooms/${classroomId}/students`);
        return response.data;
    },

    // Add student to classroom
    async addStudent(classroomId, studentId) {
        const response = await apiClient.post(`/classrooms/${classroomId}/students/${studentId}`);
        return response.data;
    },

    // Remove student from classroom
    async removeStudent(classroomId, studentId) {
        const response = await apiClient.delete(`/classrooms/${classroomId}/students/${studentId}`);
        return response.data;
    },

    // ==================== Attendance ====================

    // Get attendance for a class
    async getAttendance(classroomId, date = null) {
        const params = date ? { date } : {};
        const response = await apiClient.get(`/classrooms/${classroomId}/attendance`, { params });
        return response.data;
    },

    // Mark attendance
    async markAttendance(classroomId, studentId, status) {
        const response = await apiClient.post(`/classrooms/${classroomId}/attendance`, {
            studentId,
            status
        });
        return response.data;
    }
};

export default classroomService;
