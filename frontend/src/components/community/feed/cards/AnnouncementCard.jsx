import React from 'react';
import { Megaphone, Calendar, Users, AlertCircle } from 'lucide-react';
import RoleBadgePill from '../../common/RoleBadgePill';
import VerifiedOfficialBadge from '../../common/VerifiedOfficialBadge';
import PostActionToolbar from './PostActionToolbar';
import PostManageMenu from '../../common/PostManageMenu';

/**
 * AnnouncementCard Component
 * Displays official university circulars, policy notifications, and placement cell alerts.
 */
export default function AnnouncementCard({
  post,
  isManageMode = false,
  onEdit,
  onDelete,
  onUserClick,
}) {
  if (!post) return null;

  const {
    title,
    content,
    announcement_type,
    target_audience,
    author = {},
    created_at,
  } = post;

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <article className="bg-white rounded-xl border-2 border-amber-200/80 p-5 shadow-2xs hover:shadow-xs transition-all space-y-4 relative overflow-hidden">
      {/* Top Banner Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

      {/* Category Banner Row */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2 pt-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Megaphone className="w-3.5 h-3.5 text-amber-600" />
          <span>Official Announcement</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {announcement_type && (
            <span className="px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
              {announcement_type.replace(/_/g, ' ')}
            </span>
          )}
          {target_audience && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70">
              <Users className="w-3 h-3" />
              <span>Audience: {target_audience}</span>
            </span>
          )}
        </div>
      </div>

      {/* Author Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => author?.id && onUserClick?.(author.id)}
            className="w-10 h-10 rounded-full shrink-0 shadow-2xs overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-500/50 transition-all text-left"
            title={`View ${author.name || 'Placement Cell'}'s profile`}
          >
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-orange-600 text-white font-bold flex items-center justify-center text-sm">
                <Megaphone className="w-5 h-5" />
              </div>
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => author?.id && onUserClick?.(author.id)}
                className="text-sm font-semibold text-slate-900 truncate hover:text-amber-700 hover:underline transition-colors text-left cursor-pointer"
              >
                {author.name || 'Placement Cell Authority'}
              </button>
              <VerifiedOfficialBadge label="Official Notice" />
              <RoleBadgePill role={author.role || 'PLACEMENT_CELL'} />
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              University Institutional Circular
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {created_at && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(created_at)}</span>
            </div>
          )}
          {isManageMode && (
            <PostManageMenu
              onEdit={() => onEdit?.(post)}
              onDelete={() => onDelete?.(post)}
            />
          )}
        </div>
      </div>

      {/* Main Announcement Content Box */}
      <div className="rounded-xl bg-amber-50/40 border border-amber-100 p-4 space-y-2">
        <h2 className="text-base font-bold text-slate-900 leading-snug">{title}</h2>
        {content && (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {content}
          </p>
        )}
      </div>

      {/* Standardized Engagement Toolbar */}
      <PostActionToolbar
        postId={post.id}
        entityType="ANNOUNCEMENT"
        initialLikes={post.interactions?.likes_count || 0}
        initialLiked={post.interactions?.is_liked_by_me || false}
        initialSaved={post.interactions?.is_bookmarked_by_me || false}
        initialComments={post.interactions?.comments_count || 0}
        shareTitle={title}
        onUserClick={onUserClick}
      />
    </article>
  );
}
