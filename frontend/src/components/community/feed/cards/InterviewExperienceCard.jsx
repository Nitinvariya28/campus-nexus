import React, { useState } from 'react';
import {
  Award,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import RoleBadgePill from '../../common/RoleBadgePill';
import VerifiedOfficialBadge from '../../common/VerifiedOfficialBadge';
import PostActionToolbar from './PostActionToolbar';
import PostManageMenu from '../../common/PostManageMenu';

const ROUND_TYPE_LABELS = {
  ONLINE_ASSESSMENT: 'Online Assessment (OA)',
  TECHNICAL: 'Technical Interview',
  CODING: 'Live Coding',
  SYSTEM_DESIGN: 'System Design',
  HR: 'HR / Behavioral',
  MANAGERIAL: 'Managerial',
  GROUP_DISCUSSION: 'Group Discussion',
  OTHER: 'Interview Round',
};

const ROUND_MODE_LABELS = {
  ONLINE: 'Online',
  OFFLINE: 'In-Person (Offline)',
  HYBRID: 'Hybrid',
  NOT_SPECIFIED: 'Not Specified',
};

/**
 * InterviewExperienceCard Component
 * Displays alumni interview breakdown, difficulty levels, round count, and preparation strategies.
 */
export default function InterviewExperienceCard({
  post,
  isManageMode = false,
  onEdit,
  onDelete,
  onUserClick,
}) {
  if (!post) return null;

  const [isRoundsExpanded, setIsRoundsExpanded] = useState(true);

  const {
    author = {},
    company,
    role_title,
    experience_type,
    result,
    difficulty,
    experience,
    preparation,
    rounds_count,
    rounds = [],
    created_at,
  } = post;

  // Outcome badge styling
  const renderResultBadge = () => {
    const norm = (result || '').toUpperCase();
    if (norm === 'SELECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Selected / Offer</span>
        </span>
      );
    }
    if (norm === 'REJECTED' || norm === 'NOT_SELECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          <span>Not Selected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        <span>{result || 'Interviewed'}</span>
      </span>
    );
  };

  // Difficulty badge styling
  const renderDifficultyBadge = () => {
    const norm = (difficulty || '').toUpperCase();
    let color = 'bg-slate-100 text-slate-700 border-slate-200';
    if (norm === 'EASY') color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (norm === 'MEDIUM') color = 'bg-amber-50 text-amber-700 border-amber-200';
    if (norm === 'HARD') color = 'bg-rose-50 text-rose-700 border-rose-200';

    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${color}`}>
        Difficulty: {difficulty}
      </span>
    );
  };

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
    <article className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all space-y-4">
      {/* Category Header Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/70">
          <Award className="w-3.5 h-3.5 text-purple-600" />
          <span>Interview Experience</span>
        </div>

        <div className="flex items-center gap-2">
          {renderResultBadge()}
          {difficulty && renderDifficultyBadge()}
        </div>
      </div>

      {/* Author Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => author?.id && onUserClick?.(author.id)}
            className="w-10 h-10 rounded-full shrink-0 shadow-2xs overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500/50 transition-all text-left"
            title={`View ${author.name || 'alumni'}'s profile`}
          >
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                {author.name ? author.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => author?.id && onUserClick?.(author.id)}
                className="text-sm font-semibold text-slate-900 truncate hover:text-purple-700 hover:underline transition-colors text-left cursor-pointer"
              >
                {author.name || 'Alumni Contributor'}
              </button>
              {author.is_verified_official && <VerifiedOfficialBadge />}
              <RoleBadgePill role={author.role || 'ALUMNI'} />
            </div>
            {author.meta && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{author.meta}</p>
            )}
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

      {/* Target Company & Role Header */}
      <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {company || 'Company Process'}
            </h3>
            {role_title && (
              <p className="text-xs text-slate-600 font-medium">{role_title}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {rounds_count !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>{rounds_count} Rounds</span>
            </span>
          )}
          {experience_type && (
            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-600">
              {experience_type.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Experience Narrative */}
      {experience && (
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Interview Process &amp; Questions
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {experience}
          </p>
        </div>
      )}

      {/* Preparation Strategy Box */}
      {preparation && (
        <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Preparation Roadmap &amp; Resources</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {preparation}
          </p>
        </div>
      )}

      {/* Detailed Interview Rounds Breakdown */}
      {rounds && rounds.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Interview Rounds Breakdown ({rounds.length})</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsRoundsExpanded(!isRoundsExpanded)}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{isRoundsExpanded ? 'Collapse Rounds' : 'Show All Rounds'}</span>
              {isRoundsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {isRoundsExpanded && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              {rounds.map((round, idx) => (
                <div
                  key={round.id || idx}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  {/* Round Header Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {round.round_number || idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {ROUND_TYPE_LABELS[round.round_type] || round.round_type || `Round ${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {round.mode && (
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium text-[11px] leading-tight shadow-2xs">
                          {ROUND_MODE_LABELS[round.mode] || round.mode}
                        </span>
                      )}
                      {round.duration_minutes && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium text-[11px] leading-tight shadow-2xs">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{round.duration_minutes} mins</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Topics Covered */}
                  {round.topics && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-500 font-semibold text-xs">Topics:</span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-medium text-xs shadow-2xs">
                        {round.topics}
                      </span>
                    </div>
                  )}

                  {/* Experience & Questions Asked */}
                  {round.description && (
                    <div className="rounded-md bg-white p-2.5 border border-slate-200/80 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Questions &amp; Experience
                      </p>
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">{round.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Standardized Engagement Toolbar */}
      <PostActionToolbar
        postId={post.id}
        entityType="INTERVIEW_EXPERIENCE"
        initialLikes={post.interactions?.likes_count ?? post.likes_count ?? 0}
        initialLiked={post.interactions?.is_liked_by_me ?? post.is_liked_by_me ?? false}
        initialSaved={post.interactions?.is_bookmarked_by_me ?? post.is_bookmarked_by_me ?? false}
        initialComments={post.interactions?.comments_count ?? post.comments_count ?? 0}
        shareTitle={company ? `${company} Interview Experience` : 'Interview Experience'}
        onUserClick={onUserClick}
      />
    </article>
  );
}
