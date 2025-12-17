/**
 * Notes API Layer - Clean API functions
 * All backend communication in one place
 */
import apiClient from '../services/apiClient';

export const notesApi = {
    // ====================
    // Notebooks
    // ====================

    getNotebooks: async () => {
        const response = await apiClient.get('/notebooks');
        return response.data;
    },

    createNotebook: async (title, color = '#6366f1') => {
        const response = await apiClient.post('/notebooks', { title, color });
        return response.data;
    },

    updateNotebook: async (id, title, color) => {
        const response = await apiClient.put(`/notebooks/${id}`, { title, color });
        return response.data;
    },

    deleteNotebook: async (id) => {
        await apiClient.delete(`/notebooks/${id}`);
    },

    // ====================
    // Sections
    // ====================

    getSections: async (notebookId) => {
        const response = await apiClient.get(`/notebooks/${notebookId}/sections`);
        return response.data;
    },

    // Get sections as a hierarchical tree
    getSectionsHierarchical: async (notebookId) => {
        const response = await apiClient.get(`/notebooks/${notebookId}/sections`, {
            params: { hierarchical: true }
        });
        return response.data;
    },

    createSection: async (notebookId, title) => {
        const response = await apiClient.post(`/notebooks/${notebookId}/sections`, { title });
        return response.data;
    },

    // Create a sub-section under a parent section
    createSubSection: async (parentId, title) => {
        const response = await apiClient.post(`/notebooks/sections/${parentId}/children`, { title });
        return response.data;
    },

    // Get children of a section
    getChildren: async (sectionId) => {
        const response = await apiClient.get(`/notebooks/sections/${sectionId}/children`);
        return response.data;
    },

    // Move a section to a new parent (or to root if parentId is null)
    moveSection: async (sectionId, parentId) => {
        const response = await apiClient.post(`/notebooks/sections/${sectionId}/move`, { parentId });
        return response.data;
    },

    updateSection: async (sectionId, title) => {
        const response = await apiClient.put(`/sections/${sectionId}`, { title });
        return response.data;
    },

    deleteSection: async (sectionId) => {
        await apiClient.delete(`/notebooks/sections/${sectionId}`);
    },

    // ====================
    // Notes
    // ====================

    getNotes: async (sectionId) => {
        const response = await apiClient.get(`/sections/${sectionId}/notes`);
        return response.data;
    },

    getNote: async (noteId) => {
        const response = await apiClient.get(`/notes/${noteId}`);
        return response.data;
    },

    createNote: async (sectionId, title = 'Untitled', content = { type: 'doc', content: [] }) => {
        const response = await apiClient.post(`/sections/${sectionId}/notes`, { title, content });
        return response.data;
    },

    updateNote: async (noteId, title, content) => {
        console.log('[API] updateNote called:', noteId, title, 'content length:', JSON.stringify(content)?.length);
        const response = await apiClient.put(`/notes/${noteId}`, { title, content });
        console.log('[API] updateNote response:', response.data?.id, response.data?.updatedAt);
        return response.data;
    },

    deleteNote: async (noteId) => {
        await apiClient.delete(`/notes/${noteId}`);
    },

    // ====================
    // Search
    // ====================

    searchNotes: async (query) => {
        const response = await apiClient.get('/notes/search', { params: { q: query } });
        return response.data;
    },

    semanticSearch: async (query, limit = 5) => {
        const response = await apiClient.get('/notes/semantic-search', { params: { q: query, limit } });
        return response.data;
    },

    // ====================
    // Pin/Favorites
    // ====================

    togglePin: async (noteId) => {
        const response = await apiClient.post(`/notes/${noteId}/toggle-pin`);
        return response.data;
    },

    getPinnedNotes: async () => {
        const response = await apiClient.get('/notes/pinned');
        return response.data;
    },

    // ====================
    // Sharing
    // ====================

    shareNote: async (noteId, username, permissionLevel = 'VIEWER') => {
        const response = await apiClient.post(`/notes/${noteId}/share`, { username, permissionLevel });
        return response.data;
    },

    // ====================
    // Versions
    // ====================

    getNoteVersions: async (noteId) => {
        const response = await apiClient.get(`/notes/${noteId}/versions`);
        return response.data;
    },

    restoreVersion: async (versionId) => {
        const response = await apiClient.post(`/notes/versions/${versionId}/restore`);
        return response.data;
    },

    // ====================
    // AI Features (kept from existing)
    // ====================

    askNotes: async (question) => {
        const response = await apiClient.post('/notes/ask', { question });
        return response.data;
    },

    suggestOrganization: async (content) => {
        const response = await apiClient.post('/ai/suggest-organization', { content });
        return response.data;
    },
};

export default notesApi;
