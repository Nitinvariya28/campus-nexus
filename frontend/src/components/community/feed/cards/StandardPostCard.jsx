import React from 'react';
import { Building2, Calendar } from 'lucide-react';
import RoleBadgePill from '../../common/RoleBadgePill';
import VerifiedOfficialBadge from '../../common/VerifiedOfficialBadge';
import TagBadge from '../../common/TagBadge';
import PostActionToolbar from './PostActionToolbar';
import PostManageMenu from '../../common/PostManageMenu';
import AuthorAvatar from '../../common/AuthorAvatar';

/**
 * StandardPostCard Component
 * Renders standard student/alumni posts, career advice, and general discussions.
 * Conforms to COMMUNITY_UI_THEME_AND_DESIGN_SYSTEM.md geometry and interaction states.
 */
export default function StandardPostCard({
  post,
  onLikeToggle,
  onBookmarkToggle,
  isManageMode = false,
  onEdit,
  onDelete,
  onUserClick,
}) {
  if (!post) return null;

  const {
    id,
    title,
    content,
    post_type,
    created_at,
    author = {},
    company,
    media = [],
    tags = [],
    interactions = {},
  } = post;

  const handleAuthorClick = () => {
    if (author?.id && onUserClick) {
      onUserClick(author.id);
    }
  };

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-3.5">
      {/* Header: Author Information */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleAuthorClick}
            className="shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500/50 rounded-full transition-all text-left"
            title={`View ${author.name || 'user'}'s profile`}
          >
            <AuthorAvatar author={author} size="md" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAuthorClick}
                className="text-sm font-semibold text-slate-900 truncate hover:text-blue-600 hover:underline transition-colors text-left cursor-pointer"
              >
                {author.name || 'Anonymous User'}
              </button>
              {author.is_verified_official && <VerifiedOfficialBadge />}
              <RoleBadgePill role={author.role || 'STUDENT'} />
            </div>
            {author.meta && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{author.meta}</p>
            )}
          </div>
        </div>

        {/* Date and Manage Action */}
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

      {/* Meta Bar: Sub-Category / Company */}
      {(post_type || company) && (
        <div className="flex items-center gap-2 flex-wrap">
          {post_type && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
              {post_type.replace(/_/g, ' ')}
            </span>
          )}
          {company && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span>{company}</span>
            </span>
          )}
        </div>
      )}

      {/* Content: Title & Body */}
      <div className="space-y-1.5">
        {title && <h2 className="text-base font-bold text-slate-900 leading-snug">{title}</h2>}
        {content && (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {content}
          </p>
        )}
      </div>

      {/* Media Attachments */}
      {media && media.length > 0 && (
        <div className="rounded-lg overflow-hidden border border-slate-200/80 bg-slate-50 max-h-80">
          {media.map((m, idx) => (
            <img
              key={m.id || idx}
              src={m.url || m.file}
              alt={title || "Post attachment"}
              className="w-full h-auto object-cover max-h-80"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ))}
        </div>
      )}

      {/* Tag Badges */}
      {tags && tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {tags.map((tag, idx) => (
            <TagBadge key={idx} tag={tag} />
          ))}
        </div>
      )}

      {/* Standardized Engagement Toolbar */}
      <PostActionToolbar
        postId={id}
        entityType="POST"
        initialLikes={interactions?.likes_count ?? post?.likes_count ?? 0}
        initialLiked={interactions?.is_liked_by_me ?? post?.is_liked_by_me ?? false}
        initialSaved={interactions?.is_bookmarked_by_me ?? post?.is_bookmarked_by_me ?? false}
        initialComments={interactions?.comments_count ?? post?.comments_count ?? 0}
        shareTitle={title}
        onLikeChange={onLikeToggle}
        onBookmarkChange={onBookmarkToggle}
        onUserClick={onUserClick}
      />
    </article>
  );
}
