import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUnifiedFeed } from '../../services/community/communityService';

/**
 * useUnifiedFeed Hook
 * Custom hook to manage the polymorphic community feed stream.
 * 
 * Rules:
 * - Zero caching policy: Direct API calls to ensure live and fresh responses.
 * - DRF LimitOffsetPagination: limit = 10, offset increments by 10.
 * - Reactive to active role filters and author_id changes.
 * - Race-condition safe: ignores stale asynchronous responses.
 */
export default function useUnifiedFeed({
  roles = ['ALL'],
  authorId = null,
  limit = 10,
} = {}) {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  // Track latest request to avoid race conditions
  const requestIdRef = useRef(0);

  // Normalize roles parameter for memoization
  const rolesKey = Array.isArray(roles) ? roles.slice().sort().join(',') : String(roles);

  // Initial Fetch or Filter Change
  const fetchFeedData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchUnifiedFeed({
        limit,
        offset: 0,
        role: roles,
        author_id: authorId,
      });

      // Ignore if a newer request has superseded this one
      if (currentRequestId !== requestIdRef.current) return;

      const results = data.results || [];
      const count = data.count || 0;

      setItems(results);
      setTotalCount(count);
      setOffset(0);
      setHasMore(results.length < count && Boolean(data.next));
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error('Error fetching unified feed:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load community feed.');
      setItems([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [rolesKey, authorId, limit]);

  // Trigger initial fetch on filter / author / limit change
  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  // Load Next Page (Pagination)
  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    const currentRequestId = ++requestIdRef.current;
    setIsLoadingMore(true);
    setError(null);

    const nextOffset = offset + limit;

    try {
      const data = await fetchUnifiedFeed({
        limit,
        offset: nextOffset,
        role: roles,
        author_id: authorId,
      });

      if (currentRequestId !== requestIdRef.current) return;

      const newResults = data.results || [];
      const updatedItems = [...items, ...newResults];
      const count = data.count || totalCount;

      setItems(updatedItems);
      setTotalCount(count);
      setOffset(nextOffset);
      setHasMore(updatedItems.length < count && Boolean(data.next));
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      console.error('Error loading more feed items:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load more posts.');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [isLoading, isLoadingMore, hasMore, offset, limit, roles, authorId, items, totalCount]);

  // Refresh current feed without wiping UI immediately
  const refreshFeed = useCallback(() => {
    return fetchFeedData();
  }, [fetchFeedData]);

  return {
    items,
    totalCount,
    offset,
    limit,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refreshFeed,
  };
}
