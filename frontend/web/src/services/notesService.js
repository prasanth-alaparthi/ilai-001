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
    // Get sections as nested tree structure
    async listSectionsHierarchical(notebookId) {
        const res = await apiClient.get(`/notebooks/${notebookId}/sections`, { params: { hierarchical: true } });
        return res.data;
    },
    async createSection(notebookId, title) {
        const res = await apiClient.post(`/notebooks/${notebookId}/sections`, { title });
        return res.data;
    },
    // Create a sub-section (nested under parent)
    async createSubSection(parentId, title) {
        const res = await apiClient.post(`/notebooks/sections/${parentId}/children`, { title });
        return res.data;
    },
    // Get children of a section
    async getSectionChildren(sectionId) {
        const res = await apiClient.get(`/notebooks/sections/${sectionId}/children`);
        return res.data;
    },
    // Move section to new parent (null = root)
    async moveSection(sectionId, parentId) {
        const res = await apiClient.post(`/notebooks/sections/${sectionId}/move`, { parentId });
        return res.data;
    },
    async updateSection(id, title) {
        const res = await apiClient.put(`/sections/${id}`, { title });
        return res.data;
    },
    async deleteSection(id) {
        await apiClient.delete(`/notebooks/sections/${id}`);
    },
    // Aliases for "Chapter" terminology
    async listChapters(notebookId) { return this.listSections(notebookId); },
    async listChaptersHierarchical(notebookId) { return this.listSectionsHierarchical(notebookId); },
    async createChapter(notebookId, title) { return this.createSection(notebookId, title); },
    async createSubChapter(parentId, title) { return this.createSubSection(parentId, title); },
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

    // Sharing - share any resource (notebook, section, note)
    async shareResource(resourceType, resourceId, targetUsername, permissionLevel, message = "") {
        const res = await apiClient.post("/share", {
            resourceType,
            resourceId,
            targetUsername,
            permissionLevel,
            message
        });
        return res.data;
    },
    // Convenience methods
    async shareNotebook(notebookId, targetUsername, permissionLevel, message) {
        return this.shareResource("NOTEBOOK", notebookId, targetUsername, permissionLevel, message);
    },
    async shareSection(sectionId, targetUsername, permissionLevel, message) {
        return this.shareResource("SECTION", sectionId, targetUsername, permissionLevel, message);
    },
    async shareNote(noteId, targetUsername, permissionLevel, message) {
        return this.shareResource("NOTE", noteId, targetUsername, permissionLevel, message);
    },
    // Get resources shared with me
    async getSharedWithMe() {
        const res = await apiClient.get("/share/with-me");
        return res.data;
    },
    // Get pending share invitations
    async getPendingInvitations() {
        const res = await apiClient.get("/share/pending");
        return res.data;
    },
    // Get shares I've created
    async getMyShares() {
        const res = await apiClient.get("/share/my-shares");
        return res.data;
    },
    // Accept a share invitation
    async acceptShare(shareId) {
        const res = await apiClient.post(`/share/${shareId}/accept`);
        return res.data;
    },
    // Remove/decline a share
    async removeShare(shareId) {
        await apiClient.delete(`/share/${shareId}`);
    },
    // Legacy link-based sharing (generates public URL)
    async generateShareLink(noteId) {
        const res = await apiClient.post(`/notes/share/${noteId}`);
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

    // Links
    async getBacklinks(id) {
        const res = await apiClient.get(`/notes/${id}/backlinks`);
        return res.data;
    },
    async getAllLinks(id) {
        const res = await apiClient.get(`/notes/${id}/links`);
        return res.data;
    },
    async getUserGraph() {
        const res = await apiClient.get("/notes/graph");
        return res.data;
    },
    async getBrokenLinks() {
        const res = await apiClient.get("/notes/broken-links");
        return res.data;
    },
    async getNotePreview(title) {
        const res = await apiClient.get(`/notes/preview?title=${encodeURIComponent(title)}`);
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
    },

    // AI Writing Assistant (Grammarly-like features)
    async grammarCheck(text) {
        const res = await apiClient.post("/ai/writing/grammar-check", { text });
        return res.data;
    },
    async spellCheck(text) {
        const res = await apiClient.post("/ai/writing/spell-check", { text });
        return res.data;
    },
    async improveSentence(text, style = "academic") {
        const res = await apiClient.post("/ai/writing/improve", { text, style });
        return res.data;
    },
    async getWritingScore(text) {
        const res = await apiClient.post("/ai/writing/score", { text });
        return res.data;
    },
    async getWritingSuggestions(text) {
        const res = await apiClient.post("/ai/writing/suggestions", { text });
        return res.data;
    },

    // ==================== Trash / Soft Delete ====================
    async moveToTrash(noteId) {
        const res = await apiClient.post(`/notes/${noteId}/trash`);
        return res.data;
    },
    async restoreFromTrash(noteId) {
        const res = await apiClient.post(`/notes/${noteId}/restore`);
        return res.data;
    },
    async getTrash() {
        const res = await apiClient.get("/notes/trash");
        return res.data;
    },
    async emptyTrash() {
        const res = await apiClient.delete("/notes/trash");
        return res.data;
    },

    // ==================== Tags ====================
    async updateTags(noteId, tags) {
        const res = await apiClient.put(`/notes/${noteId}/tags`, { tags });
        return res.data;
    },
    async getNotesByTag(tag) {
        const res = await apiClient.get(`/notes/by-tag/${encodeURIComponent(tag)}`);
        return res.data;
    },

    // ==================== Duplicate ====================
    async duplicateNote(noteId) {
        const res = await apiClient.post(`/notes/${noteId}/duplicate`);
        return res.data;
    },

    // ==================== Summary ====================
    async getSummary(noteId) {
        const res = await apiClient.get(`/notes/${noteId}/summary`);
        return res.data;
    },
    async regenerateSummary(noteId) {
        const res = await apiClient.post(`/notes/${noteId}/summary/regenerate`);
        return res.data;
    },

    // ==================== Export ====================
    async exportNoteAsMarkdown(note) {
        // Client-side markdown generation
        const content = note.content;
        let markdown = `# ${note.title}\n\n`;

        const extractMd = (node) => {
            if (!node) return '';
            if (node.type === 'paragraph') {
                return (node.content?.map(extractMd).join('') || '') + '\n\n';
            }
            if (node.type === 'heading') {
                const level = node.attrs?.level || 1;
                return '#'.repeat(level) + ' ' + (node.content?.map(extractMd).join('') || '') + '\n\n';
            }
            if (node.type === 'text') {
                let text = node.text || '';
                if (node.marks?.some(m => m.type === 'bold')) text = `**${text}**`;
                if (node.marks?.some(m => m.type === 'italic')) text = `*${text}*`;
                return text;
            }
            if (node.type === 'bulletList') {
                return node.content?.map(li => '- ' + extractMd(li)).join('') || '';
            }
            if (node.type === 'orderedList') {
                return node.content?.map((li, i) => `${i + 1}. ` + extractMd(li)).join('') || '';
            }
            if (node.type === 'listItem') {
                return (node.content?.map(extractMd).join('').trim() || '') + '\n';
            }
            if (node.content) {
                return node.content.map(extractMd).join('');
            }
            return '';
        };

        markdown += extractMd(content);
        return markdown;
    }
};
