import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, Briefcase, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import AuthorAvatar from '../../community/common/AuthorAvatar';
import RoleBadgePill from '../../community/common/RoleBadgePill';

/**
 * RecommendationCard Component
 * Adaptive card rendering both Student and Alumni recommendation profiles.
 * Preserves AlumiBridge design language (rounded-xl, border-slate-200, clean typography).
 */
export default function RecommendationCard({ profile }) {
  const navigate = useNavigate();

  if (!profile) return null;

  const isStudent = (profile.role || 'STUDENT').toUpperCase() === 'STUDENT';
  const targetUserId = profile.user_id || profile.id;

  const handleNavigateProfile = () => {
    if (targetUserId) {
      navigate(`/community?user=${targetUserId}`);
    }
  };

  // Format match score
  const rawScore = profile.matching_score ?? profile.match_score ?? 80;
  const matchScore = typeof rawScore === 'number'
    ? Math.round(rawScore)
    : (rawScore ? Math.round(parseFloat(rawScore)) : 80);

  const getMatchScoreBadge = (score) => {
    if (score == null) return null;
    let colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 80) {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (score >= 60) {
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (score >= 40) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorClass}`}
        title={`Profile Match: ${score}%`}
      >
        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
        <span>{score}% Match</span>
      </span>
    );
  };

  const skills = Array.isArray(profile.technical_skills) && profile.technical_skills.length > 0
    ? profile.technical_skills
    : (Array.isArray(profile.shared_skills) ? profile.shared_skills : []);
  const displaySkills = skills.slice(0, 4);
  const remainingSkillsCount = skills.length - displaySkills.length;

  const authorPayload = {
    id: targetUserId,
    name: profile.full_name,
    avatar: profile.profile_photo,
    role: profile.role || (isStudent ? 'STUDENT' : 'ALUMNI'),
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between group">
      <div className="space-y-3.5">
        {/* Top Header: Avatar + Name + Match Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <AuthorAvatar
              author={authorPayload}
              size="lg"
              className="ring-2 ring-slate-100 group-hover:ring-blue-400 transition-all shrink-0 cursor-pointer"
              onClick={handleNavigateProfile}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4
                  onClick={handleNavigateProfile}
                  className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer truncate"
                >
                  {profile.full_name}
                </h4>
                <RoleBadgePill role={profile.role || (isStudent ? 'STUDENT' : 'ALUMNI')} />
              </div>

              {/* Sub-headline: Academic or Professional title */}
              {profile.headline ? (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                  {isStudent ? (
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{profile.headline}</span>
                </div>
              ) : isStudent ? (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {[profile.branch_department, profile.academic_year_or_semester, profile.department]
                      .filter(Boolean)
                      .join(' • ') || 'Student Member'}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {[profile.current_job_designation, profile.current_company, profile.department]
                      .filter(Boolean)
                      .join(' at ') || 'Alumni Member'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Match Score Badge */}
          {matchScore != null && (
            <div className="shrink-0">
              {getMatchScoreBadge(matchScore)}
            </div>
          )}
        </div>

        {/* Additional Metadata / Details Row */}
        <div className="text-xs text-slate-600 space-y-1">
          {!isStudent && (
            <div className="flex items-center gap-2 text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Class of {profile.graduation_year || 'N/A'} {profile.branch_department ? `(${profile.branch_department})` : ''}
              </span>
            </div>
          )}

          {/* Experience or Project Summary snippet */}
          {(profile.experience_summary || profile.projects_summary || profile.headline) && (
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 bg-slate-50/70 p-2 rounded-xl border border-slate-100">
              {profile.experience_summary || profile.projects_summary || profile.headline}
            </p>
          )}
        </div>

        {/* Skills Tag Cloud */}
        {skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {displaySkills.map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-slate-100/90 text-slate-700 rounded-md text-[11px] font-medium border border-slate-200/60"
              >
                {skill}
              </span>
            ))}
            {remainingSkillsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md text-[10px] font-medium">
                +{remainingSkillsCount} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom CTA Button */}
      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Verified profile</span>
        </span>

        <button
          type="button"
          onClick={handleNavigateProfile}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/60 text-slate-700 hover:text-blue-600 transition-all cursor-pointer shadow-2xs"
        >
          <span>View Profile</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
