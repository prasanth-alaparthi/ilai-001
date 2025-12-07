import apiClient from "./apiClient";

export const notesService = {
    // Notebooks
    async listNotebooks() {
        const res = await apiClient.get("/notebooks");
        return res.data;
    },
    async createNotebook(title, color) {
        const res = await apiClient.post("/notebooks", { title, color });
        return res.data;
    },
    async updateNotebook(id, title, color) {
        const res = await apiClient.put(`/notebooks/${id}`, { title, color });
        return res.data;
    },
    async deleteNotebook(id) {
        await apiClient.delete(`/notebooks/${id}`);
    },

    // Sections (Chapters)
    async listSections(notebookId) {
        const res = await apiClient.get(`/notebooks/${notebookId}/sections`);
        return res.data;
    },
    async createSection(notebookId, title) {
        const res = await apiClient.post(`/notebooks/${notebookId}/sections`, { title });
        return res.data;
    },
    async updateSection(id, title) {
        const res = await apiClient.put(`/sections/${id}`, { title });
        return res.data;
    },
    async deleteSection(id) {
        await apiClient.delete(`/sections/${id}`);
    },
    // Aliases for "Chapter" terminology
    async listChapters(notebookId) { return this.listSections(notebookId); },
    async createChapter(notebookId, title) { return this.createSection(notebookId, title); },
    async updateChapter(id, title) { return this.updateSection(id, title); },
    async deleteChapter(id) { return this.deleteSection(id); },

    // Notes
    async listNotes(query = "", tag = "") {
        const params = {};
        if (query) params.q = query;
        if (tag) params.tag = tag;
        const res = await apiClient.get("/notes", { params });
        return res.data;
    },
    async listNotesInSection(sectionId) {
        const res = await apiClient.get(`/sections/${sectionId}/notes`);
        return res.data;
    },
    async listNotesInChapter(chapterId) { return this.listNotesInSection(chapterId); },
    async getNote(id) {
        const res = await apiClient.get(`/notes/${id}`);
        return res.data;
    },
    async createNote(sectionId, title, content) {
        const res = await apiClient.post(`/sections/${sectionId}/notes`, { title, content });
        return res.data;
    },
    async updateNote(id, title, content) {
        const res = await apiClient.put(`/notes/${id}`, { title, content });
        return res.data;
    },
    async deleteNote(id) {
        await apiClient.delete(`/notes/${id}`);
    },
    async togglePin(id) {
        const res = await apiClient.post(`/notes/${id}/toggle-pin`);
        return res.data;
    },
    async getPinnedNotes() {
        const res = await apiClient.get("/notes/pinned");
        return res.data;
    },
    async searchNotes(query) {
        const res = await apiClient.get("/notes/search", { params: { q: query } });
        return res.data;
    },
    async semanticSearch(query, limit = 5) {
        const res = await apiClient.get("/notes/semantic-search", { params: { q: query, limit } });
        return res.data;
    },
    async reorderNotes(noteIds) {
        const res = await apiClient.post("/notes/reorder", noteIds);
        return res.data;
    },

    // Sharing
    async shareNote(id, username, permissionLevel) {
        const res = await apiClient.post(`/notes/${id}/share`, { username, permissionLevel });
        return res.data;
    },

    // Versions
    async getNoteVersions(id) {
        const res = await apiClient.get(`/notes/${id}/versions`);
        return res.data;
    },
    async restoreNoteVersion(versionId) {
        const res = await apiClient.post(`/notes/versions/${versionId}/restore`);
        return res.data;
    },

    // Backlinks
    async getBacklinks(id) {
        const res = await apiClient.get(`/notes/${id}/backlinks`);
        return res.data;
    },

    // Calendar
    async linkNoteToCalendar(id, calendarEventId, calendarProvider) {
        const res = await apiClient.post(`/notes/${id}/calendar-link`, { calendarEventId, calendarProvider });
        return res.data;
    },
    async getCalendarLinks(id) {
        const res = await apiClient.get(`/notes/${id}/calendar-links`);
        return res.data;
    },
    async unlinkNoteFromCalendar(linkId) {
        await apiClient.delete(`/notes/calendar-links/${linkId}`);
    },

    // AI
    async summarize(content) {
        const res = await apiClient.post("/ai/summarize", { content });
        return res.data;
    },
    async explain(content, level = "easy") {
        const res = await apiClient.post("/ai/explain", { content, level });
        return res.data;
    },
    async flashcards(content) {
        const res = await apiClient.post("/ai/flashcards", { content });
        return res.data;
    },
    async generateQuiz(content) {
        const res = await apiClient.post("/ai/generate-quiz", { content });
        return res.data;
    },
    async transcribe(file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiClient.post("/ai/transcribe", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res.data;
    },
    async suggestOrganization(content) {
        const res = await apiClient.post("/ai/suggest-organization", { content });
        return res.data;
    }
};
