import React, { useState, useEffect, useCallback } from 'react';
import CommentInputForm from './CommentInputForm';
import CommentItem from './CommentItem';
import { fetchPostComments, createPostComment } from '../../../../services/community/communityService';
import { useCommunityStats } from '../../../../context/CommunityStatsContext';
import { Loader2, MessageSquare, AlertCircle } from 'lucide-react';

/**
 * CommentThread Component
 * Expandable Comment Section per Section 6 of AlumiBridge_post.docx:
 * - Hidden by default, expands when user clicks Comment on any post card
 * - CommentInputForm on top
 * - CommentList with author image, name, content, and timestamp
 * - Pagination / Load More comments support
 */
export default function CommentThread({ postId, entityType = 'POST', onCommentAdded, onCommentsCountSync, onUserClick }) {
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const { adjustComments } = useCommunityStats();

  // Fetch initial comments
  const loadInitialComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPostComments(postId, { limit: 10, offset: 0, type: entityType });
      const results = data.results || [];
      const count = data.count !== undefined ? data.count : results.length;
      setComments(results);
      setTotalCount(count);
      setOffset(0);
      setHasMore(results.length < count && Boolean(data.next));
      if (onCommentsCountSync) {
        onCommentsCountSync(count);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
      setError('Unable to load comments at this time.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, entityType, onCommentsCountSync]);

  useEffect(() => {
    loadInitialComments();
  }, [loadInitialComments]);

  // Load More Comments
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextOffset = offset + 10;
    try {
      const data = await fetchPostComments(postId, { limit: 10, offset: nextOffset, type: entityType });
      const newResults = data.results || [];
      setComments((prev) => [...prev, ...newResults]);
      setOffset(nextOffset);
      setHasMore(comments.length + newResults.length < (data.count || totalCount));
    } catch (err) {
      console.error('Failed to load more comments:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Submit New Comment
  const handleAddComment = async (text) => {
    setIsSubmitting(true);
    try {
      const res = await createPostComment(postId, text, { type: entityType });
      const newComment = res.comment;
      if (newComment) {
        setComments((prev) => [newComment, ...prev]);
        setTotalCount((prev) => prev + 1);
        adjustComments(1);
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
      return true;
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Could not post comment. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-3.5 mt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
      {/* 6.1 Comment Input */}
      <CommentInputForm onSubmit={handleAddComment} isSubmitting={isSubmitting} />

      {/* 6.2 Comment List */}
      <div className="space-y-1 pt-1">
        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-3 w-36 bg-slate-200 rounded" />
            </div>
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-3 w-48 bg-slate-200 rounded" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>No comments yet. Be the first to start the discussion!</span>
          </div>
        ) : (
          <div>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onUserClick={onUserClick} />
            ))}

            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading older comments...</span>
                    </>
                  ) : (
                    <span>Load older comments</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
