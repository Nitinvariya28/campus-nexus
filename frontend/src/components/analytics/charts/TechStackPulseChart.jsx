import React from 'react';
import { Cpu } from 'lucide-react';
import ChartCard from './ChartCard';
import ChartEmptyState from './ChartEmptyState';

const BAR_THEMES = [
  { color: '#2563EB', bar: 'from-blue-600 to-blue-500' },
  { color: '#D97706', bar: 'from-amber-500 to-amber-400' },
  { color: '#7C3AED', bar: 'from-purple-600 to-purple-500' },
  { color: '#059669', bar: 'from-emerald-600 to-emerald-500' },
  { color: '#EA580C', bar: 'from-orange-600 to-orange-500' },
  { color: '#E11D48', bar: 'from-rose-600 to-rose-500' },
  { color: '#0D9488', bar: 'from-teal-600 to-teal-500' },
  { color: '#4F46E5', bar: 'from-indigo-600 to-indigo-500' },
];

const PILL_BADGE_CLASSES = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-rose-50 text-rose-700 border-rose-200',
];

/**
 * TechStackPulseChart Component (Visual 8)
 * Dual-panel skill ecosystem: Ranked horizontal bars on left + interactive skill cloud on right.
 * Strictly consumes live API data. Zero mock fallback arrays.
 * Backed by data.common.skills_pulse.top_skills (supports skill__name, skill_name, name)
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function TechStackPulseChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4 my-auto">
          <div className="space-y-2.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-slate-100 rounded" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-6 w-16 bg-slate-100 rounded-full" />
            ))}
          </div>
        </div>
        <div className="h-3 w-32 bg-slate-100 rounded" />
      </div>
    );
  }

  const rawSkills = data?.common?.skills_pulse?.top_skills || [];
  const totalUsers = Number(data?.common?.platform_overview?.total_users || 0);

  // Peak skill count across the returned cohort for relative progress scaling
  const maxSkillCount = Math.max(
    ...rawSkills.map((s) => Number(s.distinct_users ?? s.count ?? 0)),
    1
  );

  // Extract non-empty ranked skills strictly from live API records
  const rankedSkills = rawSkills
    .map((s, idx) => {
      const name = (s.skill__name || s.skill_name || s.name || s.skill || '').trim();
      const count = Number(s.distinct_users ?? s.count ?? 0);

      // Real adoption percentage: calculated from total registered campus members
      const pct = totalUsers > 0
        ? Number(((count / totalUsers) * 100).toFixed(1))
        : Number(((count / maxSkillCount) * 100).toFixed(1));

      // Bar width visually scales relative to top rank skill in the cohort
      const barWidth = Math.min(Math.round((count / maxSkillCount) * 100), 100);

      const theme = BAR_THEMES[idx % BAR_THEMES.length];
      const badgeClass = PILL_BADGE_CLASSES[idx % PILL_BADGE_CLASSES.length];

      return {
        name,
        count,
        pct,
        barWidth,
        color: theme.color,
        bar: theme.bar,
        bg: badgeClass,
      };
    })
    .filter((s) => s.name.length > 0 && s.count > 0);

  // If no data returned from API, render empty state
  if (rankedSkills.length === 0) {
    return (
      <ChartCard
        title="Campus Tech Stack Pulse"
        subtitle="Most declared competencies across students & alumni cohorts"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="Tech Stack Not Available"
          message="Technical issue or no skill records found for this visualization."
        />
      </ChartCard>
    );
  }

  const pills = rankedSkills;

  return (
    <ChartCard
      title="Campus Tech Stack Pulse"
      subtitle="Most declared competencies across students & alumni cohorts"
      heightClass="h-64"
    >
      <div className="h-full flex flex-col justify-between">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0 pt-1">
          {/* Left: Ranked Progress Bars */}
          <div className="md:col-span-6 space-y-2 pr-2 border-r border-slate-100 overflow-y-auto">
            {rankedSkills.map((skill) => (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: skill.color }}
                    />
                    <span className="font-semibold text-slate-800 truncate" title={skill.name}>
                      {skill.name}
                    </span>
                  </div>
                  <span
                    className="font-mono text-[11px] font-semibold text-slate-700 shrink-0"
                    title={`${skill.count} verified declarations (${skill.pct}% campus adoption)`}
                  >
                    {skill.count} <span className="text-[10px] text-slate-400 font-normal">({skill.pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${skill.bar}`}
                    style={{ width: `${skill.barWidth}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Right: Interactive Skill Badges / Cloud */}
          <div className="md:col-span-6 flex flex-wrap content-start gap-1.5 overflow-y-auto pl-1 pr-1">
            {pills.map((pill) => (
              <span
                key={pill.name}
                title={`${pill.name}: ${pill.count} verified declarations`}
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors hover:shadow-xs cursor-default ${pill.bg}`}
              >
                {pill.name}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            Verified skill declarations
          </span>
          <span className="font-medium text-slate-500">
            {rankedSkills.length} Tracked Skills
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
