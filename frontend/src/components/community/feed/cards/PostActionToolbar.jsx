import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Bookmark, Share2 } from 'lucide-react';
import CommentThread from '../comments/CommentThread';
import { togglePostLike, togglePostBookmark } from '../../../../services/community/communityService';
import { useCommunityStats } from '../../../../context/CommunityStatsContext';

/**
 * PostActionToolbar Component
 * Standardized Engagement Toolbar per Sections 5 & 6 of AlumiBridge_post.docx:
 * - Like / Unlike button (saves/removes reaction, updates count)
 * - Save / Unsave button (saves/removes bookmark)
 * - Comment button (expands/collapses the expandable comment section for this post only)
 * - Share button
 * - Expandable CommentThread section containing CommentInputForm & CommentList
 */
export default function PostActionToolbar({
  postId,
  entityType = 'POST',
  initialLikes = 0,
  initialLiked = false,
  initialSaved = false,
  initialComments = 0,
  shareTitle = '',
  onLikeChange,
  onBookmarkChange,
  onUserClick,
}) {
  const [isLiked, setIsLiked] = useState(Boolean(initialLiked));
  const [likesCount, setLikesCount] = useState(Number(initialLikes) || 0);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(initialSaved));
  const [commentsCount, setCommentsCount] = useState(Number(initialComments) || 0);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const { adjustLikes, adjustSaved } = useCommunityStats();

  // Synchronize state whenever initial interaction props change or arrive
  useEffect(() => {
    setIsLiked(Boolean(initialLiked));
    setLikesCount(Number(initialLikes) || 0);
    setIsBookmarked(Boolean(initialSaved));
    setCommentsCount(Number(initialComments) || 0);
  }, [initialLikes, initialLiked, initialSaved, initialComments]);

  // Like Toggle
  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    adjustLikes(nextState ? 1 : -1);

    try {
      const res = await togglePostLike(postId, entityType);
      if (res) {
        setIsLiked(res.is_liked_by_me);
        setLikesCount(res.likes_count);
        if (onLikeChange) onLikeChange(res);
      }
    } catch (err) {
      // Rollback on failure
      console.error('Like toggle failed:', err);
      setIsLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
      adjustLikes(nextState ? -1 : 1);
    }
  };

  // Bookmark / Save Toggle
  const handleBookmark = async () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    adjustSaved(nextState ? 1 : -1);

    try {
      const res = await togglePostBookmark(postId, entityType);
      if (res) {
        setIsBookmarked(res.is_bookmarked_by_me);
        if (onBookmarkChange) onBookmarkChange(res);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
      setIsBookmarked(!nextState);
      adjustSaved(nextState ? -1 : 1);
    }
  };

  // Toggle Comment Thread Expansion
  const toggleComments = () => {
    setIsCommentsExpanded((prev) => !prev);
  };

  // Handle Share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shareTitle || 'AlumiBridge Community Post',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="pt-2">
      {/* Action Buttons Row */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Like / Unlike Button */}
          <button
            type="button"
            onClick={handleLike}
            className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
              isLiked
                ? 'text-rose-600 font-semibold bg-rose-50/80'
                : 'hover:text-rose-600 hover:bg-slate-50'
            }`}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comment Button (Expands/Collapses Comment Section) */}
          <button
            type="button"
            onClick={toggleComments}
            className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
              isCommentsExpanded
                ? 'text-blue-600 font-semibold bg-blue-50/80'
                : 'hover:text-blue-600 hover:bg-slate-50'
            }`}
            title="Comments"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{commentsCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Save / Unsave Button */}
          <button
            type="button"
            onClick={handleBookmark}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isBookmarked
                ? 'text-amber-600 bg-amber-50/80'
                : 'text-slate-400 hover:text-amber-600 hover:bg-slate-50'
            }`}
            title={isBookmarked ? 'Saved to Bookmarks' : 'Save Post'}
            aria-label="Save Post"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Share"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Comment Section (Hidden by default, expands per post) */}
      {isCommentsExpanded && (
        <CommentThread
          postId={postId}
          entityType={entityType}
          onCommentsCountSync={(count) => setCommentsCount(count)}
          onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
          onUserClick={onUserClick}
        />
      )}
    </div>
  );
}
