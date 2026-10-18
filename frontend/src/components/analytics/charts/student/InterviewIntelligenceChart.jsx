import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { HelpCircle, GitPullRequest } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const DIFFICULTY_CONFIG = {
  VERY_HARD: { label: 'Very Hard', color: '#BE123C', badgeBg: 'bg-rose-100 text-rose-800' },
  HARD: { label: 'Hard', color: '#E11D48', badgeBg: 'bg-rose-50 text-rose-700' },
  MEDIUM: { label: 'Medium', color: '#F59E0B', badgeBg: 'bg-amber-50 text-amber-700' },
  EASY: { label: 'Easy', color: '#10B981', badgeBg: 'bg-emerald-50 text-emerald-700' },
};

/**
 * InterviewIntelligenceChart Component (Visual 7 - Student Dashboard Row 4 Col 1)
 * Split-view widget featuring:
 * 1. Donut chart showing recorded interview difficulty ratings (Hard / Medium / Easy).
 * 2. Campus round sequence breakdown (Online Assessment, Technical, Managerial, HR).
 * Strictly consumes live API data from data.student.interview_prep.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function InterviewIntelligenceChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="w-36 h-36 rounded-full border-8 border-slate-100 mx-auto my-auto" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const prep = data?.student?.interview_prep || {};
  const diffRows = prep.advanced_insights?.result_by_difficulty || [];
  const roundDist = prep.round_analytics?.round_distribution || [];
  const avgRounds = prep.round_analytics?.avg_rounds_per_experience != null
    ? Number(prep.round_analytics.avg_rounds_per_experience).toFixed(1)
    : null;

  if ((!diffRows || diffRows.length === 0) && (!roundDist || roundDist.length === 0)) {
    return (
      <ChartCard
        title="Interview Preparation Intelligence"
        subtitle="Difficulty ratings & multi-round campus hiring stages"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Interview Data Unavailable"
          message="Technical issue: Campus interview intelligence data is not available."
        />
      </ChartCard>
    );
  }

  // Aggregate counts per difficulty level
  const diffCounts = {};
  let totalExperiences = 0;
  diffRows.forEach((row) => {
    const diff = row.difficulty || 'MEDIUM';
    const count = Number(row.count) || 0;
    diffCounts[diff] = (diffCounts[diff] || 0) + count;
    totalExperiences += count;
  });

  const chartData = Object.entries(diffCounts).map(([key, count]) => {
    const cfg = DIFFICULTY_CONFIG[key] || { label: key, color: '#64748B' };
    const pct = totalExperiences > 0 ? (count / totalExperiences) * 100 : 0;
    return {
      name: cfg.label,
      rawKey: key,
      value: count,
      percentage: parseFloat(pct.toFixed(1)),
      color: cfg.color,
    };
  });

  // Calculate consolidated round types
  const roundsMap = {};
  let totalRounds = 0;
  roundDist.forEach((r) => {
    const typeName = r.round_type.replace('_', ' ');
    const count = Number(r.count) || 0;
    roundsMap[typeName] = (roundsMap[typeName] || 0) + count;
    totalRounds += count;
  });

  const topRounds = Object.entries(roundsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <ChartCard
      title="Interview Prep Intelligence"
      subtitle="Difficulty ratings & round sequence distribution"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <HelpCircle className="w-3 h-3 text-rose-600" />
          {avgRounds ? `${avgRounds} Avg Rounds` : 'Interview Experience'}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Upper: Difficulty Donut & Stats */}
        <div className="grid grid-cols-2 gap-2 items-center">
          <div className="relative h-36 w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </div>
                        <div className="text-slate-500 mt-1">
                          {item.value} interviews ({item.percentage}%)
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={52}
                  paddingAngle={3}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-slate-900 leading-none">
                {totalExperiences}
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Rounds</span>
            </div>
          </div>

          {/* Difficulty Legend */}
          <div className="space-y-1.5 pr-2">
            {chartData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="font-semibold text-slate-800">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lower: Common Campus Round Sequence Bars */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <GitPullRequest className="w-3 h-3 text-indigo-500" />
              Common Round Types
            </span>
            <span>Total: {totalRounds}</span>
          </div>

          {topRounds.map(([rName, rCount], idx) => {
            const pct = totalRounds > 0 ? (rCount / totalRounds) * 100 : 0;
            return (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span className="truncate capitalize">{rName.toLowerCase()}</span>
                  <span className="font-medium text-slate-900">{rCount}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
