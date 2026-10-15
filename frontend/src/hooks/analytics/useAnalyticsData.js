import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDashboardData } from '../../services/analytics/analyticsService';

/**
 * Custom React Hook for fetching and caching dashboard analytics data.
 * Manages loading states, error boundaries, and API request cancellation.
 *
 * @param {string} view - Active dashboard view ('common' | 'student' | 'alumni' | 'placement_cell')
 * @param {object} filters - Active applied filters
 */
export function useAnalyticsData(view = 'common', filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const loadData = useCallback(async () => {
    // Cancel previous inflight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchDashboardData(view, filters, controller.signal);
      setData(result);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.detail || err.message || 'Failed to load analytics data.');
      }
    } finally {
      setLoading(false);
    }
  }, [view, JSON.stringify(filters)]);

  useEffect(() => {
    loadData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch: loadData,
  };
}

export default useAnalyticsData;
