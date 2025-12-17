import apiClient from './apiClient';

const API_BASE = '/clubs';

// ========== Club CRUD ==========

export const getAllClubs = async (category = null, search = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const queryString = params.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

    const response = await apiClient.get(url);
    return response.data;
};

export const getClubById = async (id) => {
    const response = await apiClient.get(`${API_BASE}/${id}`);
    return response.data;
};

export const createClub = async (clubData) => {
    // Use skipAuthErrorEvent to prevent global logout on 401
    const response = await apiClient.post(API_BASE, clubData, { skipAuthErrorEvent: true });
    return response.data;
};

export const updateClub = async (id, clubData) => {
    const response = await apiClient.put(`${API_BASE}/${id}`, clubData);
    return response.data;
};

export const deleteClub = async (id) => {
    const response = await apiClient.delete(`${API_BASE}/${id}`);
    return response.data;
};

// ========== Membership ==========

export const getMyClubs = async () => {
    const response = await apiClient.get(`${API_BASE}/my-clubs`);
    return response.data;
};

export const getClubMembers = async (clubId) => {
    const response = await apiClient.get(`${API_BASE}/${clubId}/members`);
    return response.data;
};

export const joinClub = async (clubId) => {
    const response = await apiClient.post(`${API_BASE}/${clubId}/join`);
    return response.data;
};

export const leaveClub = async (clubId) => {
    const response = await apiClient.post(`${API_BASE}/${clubId}/leave`);
    return response.data;
};

// ========== Posts ==========

export const getClubPosts = async (clubId) => {
    const response = await apiClient.get(`${API_BASE}/${clubId}/posts`);
    return response.data;
};

export const createClubPost = async (clubId, postData) => {
    const response = await apiClient.post(`${API_BASE}/${clubId}/posts`, postData);
    return response.data;
};

export const deleteClubPost = async (postId) => {
    const response = await apiClient.delete(`${API_BASE}/posts/${postId}`);
    return response.data;
};

export const togglePinPost = async (postId) => {
    const response = await apiClient.post(`${API_BASE}/posts/${postId}/pin`);
    return response.data;
};

// ========== Events ==========

export const getClubEvents = async (clubId, upcomingOnly = false) => {
    const response = await apiClient.get(`${API_BASE}/${clubId}/events`, {
        params: { upcomingOnly }
    });
    return response.data;
};

export const createEvent = async (clubId, eventData) => {
    const response = await apiClient.post(`${API_BASE}/${clubId}/events`, eventData);
    return response.data;
};

export const deleteEvent = async (eventId) => {
    const response = await apiClient.delete(`${API_BASE}/events/${eventId}`);
    return response.data;
};

export const rsvpEvent = async (eventId) => {
    const response = await apiClient.post(`${API_BASE}/events/${eventId}/rsvp`);
    return response.data;
};

// ========== Categories ==========

export const CLUB_CATEGORIES = [
    { id: 'ACADEMIC', name: 'Academic', icon: '📚', description: 'Study groups & subject clubs' },
    { id: 'CREATIVE', name: 'Creative', icon: '🎨', description: 'Art, Music, Writing' },
    { id: 'COMPETITION', name: 'Competition', icon: '🏆', description: 'Debate, Quiz, Hackathons' },
    { id: 'INTEREST', name: 'Interest', icon: '🎮', description: 'Gaming, Anime, Movies' },
    { id: 'SERVICE', name: 'Service', icon: '🌍', description: 'Volunteering, Community' },
];

export const EVENT_TYPES = [
    { id: 'MEETING', name: 'Meeting', icon: '📋' },
    { id: 'WORKSHOP', name: 'Workshop', icon: '🔧' },
    { id: 'COMPETITION', name: 'Competition', icon: '🏆' },
    { id: 'SOCIAL', name: 'Social', icon: '🎉' },
    { id: 'OTHER', name: 'Other', icon: '📌' },
];

export default {
    getAllClubs,
    getClubById,
    createClub,
    updateClub,
    deleteClub,
    getMyClubs,
    getClubMembers,
    joinClub,
    leaveClub,
    getClubPosts,
    createClubPost,
    deleteClubPost,
    togglePinPost,
    getClubEvents,
    createEvent,
    deleteEvent,
    rsvpEvent,
    CLUB_CATEGORIES,
    EVENT_TYPES,
};

