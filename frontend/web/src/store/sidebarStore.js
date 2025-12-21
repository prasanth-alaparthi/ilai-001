import create from 'zustand';

/**
 * Sidebar Store - Single source of truth for sidebar state
 * Manages folder highlights and WebSocket-driven updates
 */
export const useSidebarStore = create((set) => ({
    folders: [],
    highlightedFolderId: null,
    isInhaling: false,

    setFolders: (folders) => set({ folders }),

    /**
     * Trigger the "inhale" animation on a specific folder
     * Auto-fades after 40 seconds (10 breath cycles)
     */
    triggerInhale: (folderId) => {
        set({ highlightedFolderId: folderId, isInhaling: true });

        // Auto-fade after 40 seconds
        setTimeout(() => {
            set({ highlightedFolderId: null, isInhaling: false });
        }, 40000);
    },

    /**
     * Update a specific folder
     */
    updateFolder: (folderId, updates) => set((state) => ({
        folders: state.folders.map(f =>
            f.id === folderId ? { ...f, ...updates } : f
        )
    })),

    /**
     * Clear highlight manually
     */
    clearHighlight: () => set({ highlightedFolderId: null, isInhaling: false }),
}));
