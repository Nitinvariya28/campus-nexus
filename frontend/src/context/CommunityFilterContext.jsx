import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

/**
 * CommunityFilterContext
 * Manages right-sidebar and feed filter state:
 * - Selected categories (multi-choice: Interview, Placement, Career, Internship, Other)
 * - Selected trending topic / tag
 * - Feed sorting ('latest' vs 'popular')
 * - Search query term
 * 
 * Performance Design:
 * - Isolated from Left Profile Sidebar and Header counters to prevent whole-page re-renders.
 * - Actions and values are strictly memoized via useMemo / useCallback.
 */
const CommunityFilterContext = createContext(null);

export function CommunityFilterProvider({ children }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle category in/out of selected array
  const toggleCategory = useCallback((catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  }, []);

  // Set categories array directly
  const setCategories = useCallback((cats) => {
    setSelectedCategories(Array.isArray(cats) ? cats : []);
  }, []);

  // Select or switch trending tag, or toggle off if the same tag is clicked again
  const selectTag = useCallback((tagName) => {
    if (!tagName) {
      setActiveTag(null);
      return;
    }
    const cleanTag = tagName.replace(/^#/, '').trim();
    setActiveTag((prev) => (prev && prev.toLowerCase() === cleanTag.toLowerCase() ? null : cleanTag));
  }, []);

  // Explicit clear for active tag
  const clearTag = useCallback(() => {
    setActiveTag(null);
  }, []);

  // Set feed sort option ('latest' | 'popular')
  const handleSetSortBy = useCallback((sortId) => {
    setSortBy(sortId || 'latest');
  }, []);

  // Reset all right-sidebar filters
  const resetAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setActiveTag(null);
    setSortBy('latest');
    setSearchQuery('');
  }, []);

  // Boolean indicator if any custom sidebar filter is active
  const hasActiveFilters = useMemo(() => {
    return selectedCategories.length > 0 || Boolean(activeTag) || sortBy !== 'latest';
  }, [selectedCategories, activeTag, sortBy]);

  // Memoized context payload to prevent unnecessary consumer re-renders
  const contextValue = useMemo(
    () => ({
      selectedCategories,
      activeTag,
      sortBy,
      searchQuery,
      hasActiveFilters,
      toggleCategory,
      setCategories,
      selectTag,
      clearTag,
      setSortBy: handleSetSortBy,
      setSearchQuery,
      resetAllFilters,
    }),
    [
      selectedCategories,
      activeTag,
      sortBy,
      searchQuery,
      hasActiveFilters,
      toggleCategory,
      setCategories,
      selectTag,
      clearTag,
      handleSetSortBy,
      resetAllFilters,
    ]
  );

  return (
    <CommunityFilterContext.Provider value={contextValue}>
      {children}
    </CommunityFilterContext.Provider>
  );
}

/**
 * useCommunityFilter Hook
 * Custom consumer hook for accessing the isolated community filter state.
 */
export function useCommunityFilter() {
  const context = useContext(CommunityFilterContext);
  if (!context) {
    throw new Error('useCommunityFilter must be used within a CommunityFilterProvider');
  }
  return context;
}

export default CommunityFilterContext;
