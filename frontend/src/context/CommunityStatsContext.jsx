import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCommunityUserStats } from '../services/community/communityService';
import { useAuth } from './AuthContext';

const CommunityStatsContext = createContext(null);

/**
 * CommunityStatsProvider
 * Central context provider managing user's community counters in memory:
 * - your_posts_count
 * - saved_posts_count
 * - total_likes (likes given by user)
 * - total_comments (comments written by user)
 *
 * Prevents full-page re-renders and unnecessary API re-fetches when users
 * toggle like, bookmark, or submit comments from polymorphic feed cards.
 */
export function CommunityStatsProvider({ children }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    your_posts_count: 0,
    saved_posts_count: 0,
    total_likes: 0,
    total_comments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial stats from the backend API
  const reloadStats = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchCommunityUserStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading community stats in context:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reloadStats();
  }, [reloadStats]);

  // Direct state updaters (zero full page re-render)
  const adjustLikes = useCallback((delta) => {
    setStats((prev) => ({
      ...prev,
      total_likes: Math.max(0, (prev.total_likes || 0) + delta),
    }));
  }, []);

  const adjustSaved = useCallback((delta) => {
    setStats((prev) => ({
      ...prev,
      saved_posts_count: Math.max(0, (prev.saved_posts_count || 0) + delta),
    }));
  }, []);

  const adjustComments = useCallback((delta = 1) => {
    setStats((prev) => ({
      ...prev,
      total_comments: Math.max(0, (prev.total_comments || 0) + delta),
    }));
  }, []);

  const adjustPosts = useCallback((delta) => {
    setStats((prev) => ({
      ...prev,
      your_posts_count: Math.max(0, (prev.your_posts_count || 0) + delta),
    }));
  }, []);

  const value = {
    stats,
    isLoading,
    reloadStats,
    adjustLikes,
    adjustSaved,
    adjustComments,
    adjustPosts,
  };

  return (
    <CommunityStatsContext.Provider value={value}>
      {children}
    </CommunityStatsContext.Provider>
  );
}

/**
 * useCommunityStats Hook
 * Custom hook to access live community statistics & granular updaters.
 */
export function useCommunityStats() {
  const context = useContext(CommunityStatsContext);
  if (!context) {
    // Return safe fallback in case of standalone usage
    return {
      stats: {
        your_posts_count: 0,
        saved_posts_count: 0,
        total_likes: 0,
        total_comments: 0,
      },
      isLoading: false,
      reloadStats: () => {},
      adjustLikes: () => {},
      adjustSaved: () => {},
      adjustComments: () => {},
      adjustPosts: () => {},
    };
  }
  return context;
}
