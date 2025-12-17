import apiClient from './apiClient';

const billingService = {
    // Credits
    getCredits: async () => {
        const response = await apiClient.get('/api/billing/credits');
        return response.data;
    },

    getCreditHistory: async (page = 0, size = 20) => {
        const response = await apiClient.get(`/api/billing/credits/history?page=${page}&size=${size}`);
        return response.data;
    },

    // Subscription
    getSubscription: async () => {
        const response = await apiClient.get('/api/billing/subscription');
        return response.data;
    },

    getPlans: async () => {
        const response = await apiClient.get('/api/billing/plans');
        return response.data;
    },

    // Payment
    getPaymentInfo: async (plan) => {
        const response = await apiClient.get(`/api/billing/payment/${plan}`);
        return response.data;
    },

    submitPayment: async (plan, transactionId) => {
        const response = await apiClient.post('/api/billing/payment/request', {
            plan,
            transactionId
        });
        return response.data;
    },

    getPaymentHistory: async () => {
        const response = await apiClient.get('/api/billing/payment/history');
        return response.data;
    },

    // Admin
    getPendingPayments: async (page = 0, size = 20) => {
        const response = await apiClient.get(`/api/billing/admin/pending?page=${page}&size=${size}`);
        return response.data;
    },

    approvePayment: async (paymentId) => {
        const response = await apiClient.post(`/api/billing/admin/approve/${paymentId}`);
        return response.data;
    },

    rejectPayment: async (paymentId, reason) => {
        const response = await apiClient.post(`/api/billing/admin/reject/${paymentId}`, { reason });
        return response.data;
    }
};

export default billingService;
