import axios from 'axios';

// The assignment service runs on port 8089
// We can use a direct URL or configure a proxy. For now, we'll use the direct URL.
// In production, this should be routed through an API gateway or Nginx.
const API_URL = 'http://localhost:8089/api/assignments';

// Helper to get the token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

const assignmentService = {
    // Create a new assignment
    createAssignment: async (assignmentData) => {
        const response = await axios.post(API_URL, assignmentData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Get assignments for a specific course (class)
    getAssignmentsByCourse: async (courseId) => {
        const response = await axios.get(`${API_URL}/course/${courseId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Get assignments created by a specific teacher
    getAssignmentsByTeacher: async (teacherId) => {
        const response = await axios.get(`${API_URL}/teacher/${teacherId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Submit an assignment
    submitAssignment: async (submissionData) => {
        const response = await axios.post(`${API_URL}/submit`, submissionData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Get submissions for a specific assignment
    getSubmissionsByAssignment: async (assignmentId) => {
        const response = await axios.get(`${API_URL}/${assignmentId}/submissions`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Get a specific submission
    getSubmission: async (submissionId) => {
        // Note: The backend might not have a direct "get submission by ID" endpoint exposed 
        // in the main controller yet, but we can filter from the list or add it if needed.
        // For now, let's assume we might need to fetch it via the assignment list or add an endpoint.
        // Checking backend controller... 
        // Backend has: GET /api/assignments/submissions/{assignmentId}/{studentId}
        // And: GET /api/assignments/{assignmentId}/submissions
        return null; // Placeholder if needed
    },

    // Trigger auto-grading for a submission
    gradeSubmission: async (submissionId) => {
        const response = await axios.post(`${API_URL}/grade/${submissionId}`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    // Get grade for a submission
    getGrade: async (submissionId) => {
        const response = await axios.get(`${API_URL}/grade/${submissionId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default assignmentService;
