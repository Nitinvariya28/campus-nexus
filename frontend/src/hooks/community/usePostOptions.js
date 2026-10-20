import { useState, useEffect, useCallback } from 'react';
import { fetchPostCreationOptions } from '../../services/community/communityService';
import { useAuth } from '../../context/AuthContext';

/**
 * Custom hook to load dynamic post creation options based on the authenticated user's role.
 * Endpoints: GET /api/community/posts/options/
 */
export function usePostOptions() {
  const { user } = useAuth();
  const [options, setOptions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPostCreationOptions();
      setOptions(data);
    } catch (err) {
      console.error('Failed to load post creation options from backend:', err);
      setError(err?.response?.data?.error || err.message || 'Could not load form options');
      setOptions(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return {
    options,
    isLoading,
    error,
    retry: loadOptions,
    reloadOptions: loadOptions,
  };
}

export default usePostOptions;
