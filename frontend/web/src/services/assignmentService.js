import apiClient from './apiClient';

// The assignment service is now part of Classroom Service (port 8090)
// Routed via proxy /api/assignments
const API_URL = '/api/assignments';

const assignmentService = {
    // Create a new assignment
    createAssignment: async (assignmentData) => {
        const response = await apiClient.post(API_URL, assignmentData);
        return response.data;
    },

    // Get assignments for a specific course (class)
    getAssignmentsByCourse: async (courseId) => {
        const response = await apiClient.get(`${API_URL}/course/${courseId}`);
        return response.data;
    },

    // Get assignments created by a specific teacher
    getAssignmentsByTeacher: async (teacherId) => {
        const response = await apiClient.get(`${API_URL}/teacher/${teacherId}`);
        return response.data;
    },

    // Submit an assignment
    submitAssignment: async (submissionData) => {
        const response = await apiClient.post(`${API_URL}/submit`, submissionData);
        return response.data;
    },

    // Get submissions for a specific assignment
    getSubmissionsByAssignment: async (assignmentId) => {
        const response = await apiClient.get(`${API_URL}/${assignmentId}/submissions`);
        return response.data;
    },

    // Get a specific submission
    getSubmission: async (submissionId) => {
        // Placeholder
        return null;
    },

    // Trigger auto-grading for a submission
    gradeSubmission: async (submissionId) => {
        const response = await apiClient.post(`${API_URL}/grade/${submissionId}`, {});
        return response.data;
    },

    // Get grade for a submission
    getGrade: async (submissionId) => {
        const response = await apiClient.get(`${API_URL}/grade/${submissionId}`);
        return response.data;
    }
};

export default assignmentService;
