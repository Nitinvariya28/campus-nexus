import React from 'react';
import { CheckCircle2, AlertCircle, Award, Target, TrendingUp, Layers, FileCheck } from 'lucide-react';

/**
 * ATSScoreCard Component
 * Displays the comprehensive ATS Score breakdown:
 * - Big circular/radial visual score indicator (0-100)
 * - Semantic rating badge
 * - 5 dimension progress bars
 * - Matched & Missing skills cloud
 */
export default function ATSScoreCard({ result }) {
  if (!result) return null;

  const rawScore = result?.ats_score?.overall_score ?? result?.overall_score ?? result?.score ?? (typeof result?.ats_score === 'number' ? result.ats_score : 0);
  const score = Math.round(rawScore);
  const rating = result?.ats_score?.rating || result?.rating || 'STRONG_MATCH';
  const breakdown = result?.ats_score?.dimensions || result?.score_breakdown || {};

  const matchedSkills = Array.isArray(result?.ats_score?.matched_skills)
    ? result.ats_score.matched_skills
    : (Array.isArray(result?.matched_skills) ? result.matched_skills : []);
  const missingSkills = Array.isArray(result?.ats_score?.missing_skills)
    ? result.ats_score.missing_skills
    : (Array.isArray(result?.missing_skills) ? result.missing_skills : []);

  // Helper to extract score whether it is a number or { score, weight }
  const getDimScore = (val) => {
    if (val == null) return 0;
    if (typeof val === 'number') return Math.round(val);
    if (typeof val === 'object' && val.score != null) return Math.round(val.score);
    return 0;
  };

  // Rating color tokens
  const getRatingTheme = (scoreVal) => {
    if (scoreVal >= 80) {
      return {
        label: 'Excellent Match',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        strokeColor: '#059669', // emerald-600
        textColor: 'text-emerald-700',
      };
    }
    if (scoreVal >= 70) {
      return {
        label: 'Strong Match',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        strokeColor: '#2563eb', // blue-600
        textColor: 'text-blue-700',
      };
    }
    if (scoreVal >= 55) {
      return {
        label: 'Moderate Alignment',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        strokeColor: '#4f46e5', // indigo-600
        textColor: 'text-indigo-700',
      };
    }
    if (scoreVal >= 40) {
      return {
        label: 'Needs Improvement',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        strokeColor: '#d97706', // amber-600
        textColor: 'text-amber-700',
      };
    }
    return {
      label: 'Low Match',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      strokeColor: '#e11d48', // rose-600
      textColor: 'text-rose-700',
    };
  };

  const theme = getRatingTheme(score);

  // SVG Circular Meter math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const dimensionList = [
    {
      key: 'skills_alignment',
      label: 'Skills Alignment',
      value: getDimScore(breakdown.skills_match ?? breakdown.skills_alignment),
      icon: Target,
    },
    {
      key: 'experience_relevance',
      label: 'Experience Relevance',
      value: getDimScore(breakdown.experience_match ?? breakdown.experience_relevance),
      icon: TrendingUp,
    },
    {
      key: 'semantic_match',
      label: 'Role Semantic Similarity',
      value: getDimScore(breakdown.semantic_similarity ?? breakdown.keyword_density),
      icon: Layers,
    },
    {
      key: 'formatting_readability',
      label: 'ATS Readability & Formatting',
      value: getDimScore(breakdown.formatting_parseability ?? breakdown.formatting_ats_readability),
      icon: FileCheck,
    },
    {
      key: 'education_impact',
      label: 'Education & Impact Quantification',
      value: getDimScore(breakdown.education_match ?? breakdown.impact_quantification),
      icon: Award,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Overall ATS Score</h3>
          <p className="text-xs text-slate-500">
            Comprehensive recruiter parser evaluation against provided JD
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${theme.badgeClass}`}
        >
          {theme.label}
        </span>
      </div>

      {/* Main Score Showcase */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 py-2">
        {/* Circular Progress Gauge */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#f1f5f9"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={theme.strokeColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-extrabold ${theme.textColor} tracking-tight`}>
              {score}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              / 100 ATS
            </span>
          </div>
        </div>

        {/* Evaluation Summary */}
        <div className="max-w-sm space-y-2 text-center sm:text-left">
          <h4 className="text-sm font-bold text-slate-900">
            {score >= 70
              ? 'Your resume is highly optimized for this position'
              : 'Targeted adjustments will notably boost recruiter pass-rates'}
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Evaluated across keyword matching, experience alignment, ATS readability, and impact quantification.
          </p>
          <div className="text-[11px] text-slate-500">
            Evaluation: <strong className="text-slate-800 font-semibold">Ready for review & enhancements</strong>
          </div>
        </div>
      </div>

      {/* 5 Dimension Progress Breakdown */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Score Dimensions Breakdown
        </h4>

        <div className="space-y-2.5">
          {dimensionList.map((dim) => {
            const DimIcon = dim.icon;
            const val = Math.min(100, Math.max(0, dim.value));
            return (
              <div key={dim.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <DimIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dim.label}</span>
                  </span>
                  <span className="font-bold text-slate-800">{val}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matched vs Missing Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
        {/* Matched Skills */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Matched Skills ({matchedSkills.length})</span>
          </div>

          {matchedSkills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No exact skill matches detected.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Missing Skills */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Missing Target Skills ({missingSkills.length})</span>
          </div>

          {missingSkills.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Great job! No key skills missing.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80"
                >
                  +{skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
