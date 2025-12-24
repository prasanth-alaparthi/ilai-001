import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
    notifications: [],
    isDrawerOpen: false,

    addNotification: (notification) => set((state) => ({
        notifications: [
            { id: Date.now(), timestamp: new Date(), ...notification },
            ...state.notifications
        ].slice(0, 50) // Keep last 50
    })),

    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),

    toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
    setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

    clearAll: () => set({ notifications: [] })
}));
