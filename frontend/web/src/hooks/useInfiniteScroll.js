import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useInfiniteScroll - Hook for infinite scroll pagination
 */
const useInfiniteScroll = (fetchFunction, options = {}) => {
    const {
        initialLimit = 20,
        threshold = 200,  // Pixels from bottom to trigger
        enabled = true
    } = options;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const offset = useRef(0);
    const isFetching = useRef(false);

    // Initial load
    const loadInitial = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);
        offset.current = 0;

        try {
            const newItems = await fetchFunction(initialLimit, 0);
            setItems(newItems);
            setHasMore(newItems.length >= initialLimit);
            offset.current = newItems.length;
        } catch (err) {
            setError(err);
            console.error('Initial load error:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchFunction, initialLimit, enabled]);

    // Load more
    const loadMore = useCallback(async () => {
        if (!enabled || !hasMore || isFetching.current) return;

        isFetching.current = true;
        setLoadingMore(true);

        try {
            const newItems = await fetchFunction(initialLimit, offset.current);
            setItems(prev => [...prev, ...newItems]);
            setHasMore(newItems.length >= initialLimit);
            offset.current += newItems.length;
        } catch (err) {
            console.error('Load more error:', err);
        } finally {
            setLoadingMore(false);
            isFetching.current = false;
        }
    }, [fetchFunction, initialLimit, hasMore, enabled]);

    // Reset and reload
    const reset = useCallback(() => {
        setItems([]);
        setHasMore(true);
        offset.current = 0;
        loadInitial();
    }, [loadInitial]);

    // Scroll handler
    useEffect(() => {
        if (!enabled) return;

        const handleScroll = () => {
            if (loading || loadingMore || !hasMore) return;

            const scrolledToBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - threshold;

            if (scrolledToBottom) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, loadingMore, hasMore, threshold, loadMore, enabled]);

    // IntersectionObserver-based trigger (for use with ref)
    const lastItemRef = useCallback(
        (node) => {
            if (loading || loadingMore || !hasMore) return;

            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            });

            if (node) observer.observe(node);

            return () => {
                if (node) observer.unobserve(node);
            };
        },
        [loading, loadingMore, hasMore, loadMore]
    );

    // Initial load on mount
    useEffect(() => {
        loadInitial();
    }, []);

    return {
        items,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMore,
        reset,
        lastItemRef,
        setItems
    };
};

export default useInfiniteScroll;
