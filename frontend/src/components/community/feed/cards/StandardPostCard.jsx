import React from 'react';
import { Building2, Calendar } from 'lucide-react';
import RoleBadgePill from '../../common/RoleBadgePill';
import VerifiedOfficialBadge from '../../common/VerifiedOfficialBadge';
import TagBadge from '../../common/TagBadge';
import PostActionToolbar from './PostActionToolbar';

/**
 * StandardPostCard Component
 * Renders standard student/alumni posts, career advice, and general discussions.
 * Conforms to COMMUNITY_UI_THEME_AND_DESIGN_SYSTEM.md geometry and interaction states.
 */
export default function StandardPostCard({ post, onLikeToggle, onBookmarkToggle }) {
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-2xs">
            {author.name ? author.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {author.name || 'Anonymous User'}
              </span>
              {author.is_verified_official && <VerifiedOfficialBadge />}
              <RoleBadgePill role={author.role || 'STUDENT'} />
            </div>
            {author.meta && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{author.meta}</p>
            )}
          </div>
        </div>

        {/* Date */}
        {created_at && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(created_at)}</span>
          </div>
        )}
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
              src={m.url}
              alt="Post attachment"
              className="w-full h-auto object-cover max-h-80"
              loading="lazy"
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
        initialLikes={interactions.likes_count || 0}
        initialLiked={interactions.is_liked_by_me || false}
        initialSaved={interactions.is_bookmarked_by_me || false}
        initialComments={interactions.comments_count || 0}
        shareTitle={title}
        onLikeChange={onLikeToggle}
        onBookmarkChange={onBookmarkToggle}
      />
    </article>
  );
}
