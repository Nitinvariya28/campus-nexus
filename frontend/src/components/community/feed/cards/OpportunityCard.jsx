import React from 'react';
import { Briefcase, Building2, Calendar, Clock, ExternalLink, MapPin, CheckCircle2 } from 'lucide-react';
import RoleBadgePill from '../../common/RoleBadgePill';
import VerifiedOfficialBadge from '../../common/VerifiedOfficialBadge';
import PostActionToolbar from './PostActionToolbar';

/**
 * OpportunityCard Component
 * Displays institutional jobs, internships, placement drives, and deadlines.
 */
export default function OpportunityCard({ post }) {
  if (!post) return null;

  const {
    title,
    description,
    opportunity_type,
    work_mode,
    employment_type,
    application_url,
    deadline,
    company,
    skills = [],
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

  // Check if deadline is approaching
  const isExpired = deadline ? new Date(deadline) < new Date() : false;

  return (
    <article className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-4">
      {/* Category Banner Row */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
          <Briefcase className="w-3.5 h-3.5 text-blue-600" />
          <span>{opportunity_type ? opportunity_type.replace(/_/g, ' ') : 'Opportunity'}</span>
        </div>

        {deadline && (
          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isExpired
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isExpired ? 'Application Closed' : `Deadline: ${formatDate(deadline)}`}
            </span>
          </div>
        )}
      </div>

      {/* Author Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-800 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-2xs">
            {author.name ? author.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {author.name || 'Placement Cell'}
              </span>
              <VerifiedOfficialBadge />
              <RoleBadgePill role={author.role || 'PLACEMENT_CELL'} />
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              Official Institutional Opportunity
            </p>
          </div>
        </div>

        {created_at && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(created_at)}</span>
          </div>
        )}
      </div>

      {/* Main Opportunity Title & Company Box */}
      <div className="space-y-2">
        <h2 className="text-base font-bold text-slate-900 leading-snug">{title}</h2>

        <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-600">
          {company && (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{company}</span>
            </span>
          )}
          {work_mode && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 font-medium">
              {work_mode.replace(/_/g, ' ')}
            </span>
          )}
          {employment_type && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 font-medium">
              {employment_type.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line pt-1">
            {description}
          </p>
        )}
      </div>

      {/* Required Skills Badges */}
      {skills && skills.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Required Skills
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      {application_url && (
        <div className="pt-2">
          <a
            href={application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs"
          >
            <span>Apply on Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Standardized Engagement Toolbar */}
      <PostActionToolbar
        postId={post.id}
        entityType="OPPORTUNITY"
        initialLikes={post.interactions?.likes_count || 0}
        initialLiked={post.interactions?.is_liked_by_me || false}
        initialSaved={post.interactions?.is_bookmarked_by_me || false}
        initialComments={post.interactions?.comments_count || 0}
        shareTitle={title}
      />
    </article>
  );
}
