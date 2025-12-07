import apiClient from "./apiClient";

export const calendarService = {
    async getEvents(start, end) {
        const res = await apiClient.get("/calendar/events", {
            params: { start, end },
        });
        return res.data;
    },

    async getUnscheduledEvents() {
        const res = await apiClient.get("/calendar/events", {
            params: { unscheduled: true },
        });
        return res.data;
    },

    async createEvent(event) {
        const res = await apiClient.post("/calendar/events", event);
        return res.data;
    },

    async updateEvent(id, event) {
        const res = await apiClient.put(`/calendar/events/${id}`, event);
        return res.data;
    },

    async deleteEvent(id) {
        await apiClient.delete(`/calendar/events/${id}`);
    },
};
