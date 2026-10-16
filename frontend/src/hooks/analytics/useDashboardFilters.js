import { useState, useCallback } from 'react';

/**
 * Custom React Hook for managing contextual analytics filters.
 * Supports staging changes, applying changes, and resetting to defaults.
 *
 * @param {object} initialFilters - Initial filter state
 */
export function useDashboardFilters(initialFilters = {}) {
  // Staged filter state (in progress before clicking Apply)
  const [stagedFilters, setStagedFilters] = useState(initialFilters);
  // Applied filter state (triggers API re-hydration)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const setFilterValue = useCallback((key, value) => {
    setStagedFilters((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };
      // Auto-apply immediately so that dropdown changes trigger live chart re-hydration
      setAppliedFilters(next);
      return next;
    });
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...stagedFilters });
  }, [stagedFilters]);

  const resetFilters = useCallback(() => {
    setStagedFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  return {
    stagedFilters,
    appliedFilters,
    setFilterValue,
    applyFilters,
    resetFilters,
  };
}

export default useDashboardFilters;
