import React, { useRef, useCallback, useEffect } from 'react';
import useUnifiedFeed from '../../../hooks/community/useUnifiedFeed';
import PolymorphicFeedCard from './PolymorphicFeedCard';
import FeedSkeletonCard from '../common/FeedSkeletonCard';
import EmptyStateMessage from '../common/EmptyStateMessage';
import { togglePostLike, togglePostBookmark } from '../../../services/community/communityService';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useCommunityFilter } from '../../../context/CommunityFilterContext';

/**
 * CommunityFeedStream Component
 * High-performance container rendering the scalable polymorphic feed.
 * 
 * Features:
 * - Direct real-time API queries (zero caching policy)
 * - Seamless Infinite Scroll: Automatically pre-fetches the next 10 posts
 *   when the user scrolls to the 7th post of the current batch.
 * - Reactive to CommunityFilterContext (Categories, Trending Tag, Sorting)
 * - Performance optimized: Zero re-renders of the left sidebar, header, or page container.
 * - Skeleton loading states & error recovery
 * - Optimistic like and bookmark interaction triggers
 */
export default function CommunityFeedStream({
  roles = ['ALL'],
  authorId = null,
  isSaved = false,
  emptyTitle,
  emptyMessage,
  onResetFilters,
  isManageMode = false,
  onEditPost,
  onDeletePost,
  reloadKey = 0,
  onUserClick,
}) {
  let filterContext = null;
  try {
    filterContext = useCommunityFilter();
  } catch (e) {
    // Graceful fallback if rendered outside provider
  }

  const categories = filterContext?.selectedCategories ?? [];
  const tag = filterContext?.activeTag ?? null;
  const sort = filterContext?.sortBy ?? 'latest';

  const {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refreshFeed,
  } = useUnifiedFeed({
    roles,
    authorId,
    isSaved,
    categories,
    tag,
    sort,
  });

  const observerRef = useRef(null);

  // Trigger reload if reloadKey changes from parent
  useEffect(() => {
    if (reloadKey > 0) {
      refreshFeed();
    }
  }, [reloadKey, refreshFeed]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Infinite Scroll Trigger Sentinel (Attached to the 7th post of the current batch)
  const triggerSentinelRef = useCallback(
    (node) => {
      if (isLoading || isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '250px', // Pre-fetch slightly before reaching the exact node
        }
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isLoadingMore, hasMore, loadMore]
  );

  // Handle Like Action
  const handleLikeToggle = async (postId) => {
    return await togglePostLike(postId);
  };

  // Handle Bookmark Action
  const handleBookmarkToggle = async (postId) => {
    return await togglePostBookmark(postId);
  };

  // Initial Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-4">
        <FeedSkeletonCard />
        <FeedSkeletonCard />
        <FeedSkeletonCard />
      </div>
    );
  }

  // Error State with Retry CTA
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-rose-900">Unable to load feed</h3>
          <p className="text-xs text-rose-700">{error}</p>
        </div>
        <button
          type="button"
          onClick={refreshFeed}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // Empty State
  if (items.length === 0) {
    const defaultTitle = isSaved
      ? 'No Saved Posts Yet'
      : authorId
      ? 'No Posts Published Yet'
      : 'No Posts in this Category';

    const defaultMsg = isSaved
      ? 'Posts you bookmark will appear here for easy access. Click the bookmark icon on any post to save it for later.'
      : authorId
      ? 'You have not created or published any community posts yet.'
      : 'There are currently no updates or discussions published under the selected filter criteria.';

    return (
      <EmptyStateMessage
        title={emptyTitle || defaultTitle}
        message={emptyMessage || defaultMsg}
        onReset={() => {
          if (filterContext?.resetAllFilters) {
            filterContext.resetAllFilters();
          }
          if (onResetFilters) {
            onResetFilters();
          }
        }}
        resetLabel={isSaved || authorId ? null : 'Show All Posts'}
      />
    );
  }

  // Calculate target sentinel index: 7th post of the batch (or 4th from last)
  const targetTriggerIndex = items.length >= 7 ? items.length - 4 : items.length - 1;

  return (
    <div className="space-y-4">
      {/* Stream of Polymorphic Feed Cards */}
      {items.map((item, index) => {
        const isTrigger = index === targetTriggerIndex;

        return (
          <div
            key={`${item.feed_type || 'post'}-${item.id}-${index}`}
            ref={isTrigger ? triggerSentinelRef : null}
          >
            <PolymorphicFeedCard
              item={item}
              onLikeToggle={handleLikeToggle}
              onBookmarkToggle={handleBookmarkToggle}
              isManageMode={isManageMode}
              onEdit={onEditPost}
              onDelete={onDeletePost}
              onUserClick={onUserClick}
            />
          </div>
        );
      })}

      {/* Subtle Bottom Loading Spinner for Infinite Scroll */}
      {isLoadingMore && (
        <div className="py-4 flex justify-center items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading more updates...</span>
        </div>
      )}

      {/* Subtle End of Feed Marker */}
      {!hasMore && items.length > 0 && (
        <div className="pt-4 pb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200/80">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>You've reached the end of the feed</span>
          </div>
        </div>
      )}
    </div>
  );
}
