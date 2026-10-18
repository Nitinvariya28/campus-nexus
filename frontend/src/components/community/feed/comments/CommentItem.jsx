import React from 'react';
import { Link } from 'react-router-dom';
import RoleBadgePill from '../../common/RoleBadgePill';
import VerifiedOfficialBadge from '../../common/VerifiedOfficialBadge';

/**
 * CommentItem Component
 * Section 6.2 of AlumiBridge_post.docx:
 * - Horizontal layout with author profile image on the left
 * - Author name on the first line, clickable to profile view
 * - Comment content below
 * - Formatted relative timestamp
 */
export default function CommentItem({ comment }) {
  if (!comment) return null;

  const {
    id,
    author = {},
    content,
    created_at,
  } = comment;

  const initial = author.name ? author.name.charAt(0).toUpperCase() : 'U';

  const formatCommentDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const profilePath = author.id ? `/profiles/${author.id}` : '#';

  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-slate-100 last:border-b-0 text-xs">
      {/* Clickable Author Avatar */}
      <Link
        to={profilePath}
        className="shrink-0 hover:opacity-85 transition-opacity"
        title={`View ${author.name}'s profile`}
      >
        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px] shadow-2xs">
          {initial}
        </div>
      </Link>

      {/* Right Column: Name, Meta, Content, Time */}
      <div className="flex-1 min-w-0 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={profilePath}
              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
            >
              {author.name || 'Community Member'}
            </Link>
            {author.is_verified_official && <VerifiedOfficialBadge />}
            {author.role && <RoleBadgePill role={author.role} className="text-[9px] py-0 px-1.5" />}
          </div>

          {created_at && (
            <span className="text-[10px] text-slate-400 shrink-0">
              {formatCommentDate(created_at)}
            </span>
          )}
        </div>

        {/* Comment Text */}
        <p className="text-slate-700 leading-relaxed whitespace-pre-line break-words text-xs">
          {content}
        </p>
      </div>
    </div>
  );
}
