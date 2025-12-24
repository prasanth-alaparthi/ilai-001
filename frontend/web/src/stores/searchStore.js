import { create } from 'zustand';

export const useSearchStore = create((set) => ({
    query: '',
    results: [],
    isSearching: false,

    setQuery: (query) => set({ query }),
    setResults: (results) => set({ results }),
    setSearching: (isSearching) => set({ isSearching }),

    clearSearch: () => set({ query: '', results: [] })
}));
