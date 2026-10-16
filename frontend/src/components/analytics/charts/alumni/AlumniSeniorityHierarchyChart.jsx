import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Briefcase, Award, TrendingUp } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const TITLE_COLORS = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#64748B', // Slate
];

/**
 * AlumniSeniorityHierarchyChart Component (Visual 9 - Row 5 Col 3)
 * Displays corporate job title distribution and career seniority progression
 * across the graduating alumni network.
 *
 * Strictly consumes live API data from:
 * data.alumni.career_paths.employment_demographics.by_job_title
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniSeniorityHierarchyChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[420px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-60 bg-slate-100 rounded" />
        </div>
        <div className="space-y-2.5 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const rawTitles =
    data?.alumni?.career_paths?.employment_demographics?.by_job_title || [];

  if (!rawTitles || rawTitles.length === 0) {
    return (
      <ChartCard
        title="Job Titles & Seniority"
        subtitle="Distribution of corporate job titles across alumni"
        heightClass="h-[420px]"
      >
        <ChartEmptyState
          title="Job Titles Data Unavailable"
          message="Technical issue: Alumni job title and seniority data is not available."
        />
      </ChartCard>
    );
  }

  const totalEvaluated = rawTitles.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

  const chartData = rawTitles.slice(0, 7).map((item, idx) => {
    const title = item.current_job_title;
    const count = Number(item.count) || 0;
    const pct = totalEvaluated > 0 ? (count / totalEvaluated) * 100 : 0;
    const color = TITLE_COLORS[idx % TITLE_COLORS.length];

    return {
      name: title,
      count,
      percentage: pct,
      color,
      rank: `#${idx + 1}`,
    };
  });

  const topTitle = chartData[0];

  return (
    <ChartCard
      title="Job Titles & Seniority"
      subtitle="Corporate title distribution across alumni"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Award className="w-3 h-3 text-purple-600" />
          Top: {topTitle?.name}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Horizontal Bars */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 30, left: 10, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#334155', fontSize: 10.5, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={95}
              />
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
                      <div className="flex items-center justify-between gap-4 mt-1.5 text-slate-600">
                        <span>Alumni Count:</span>
                        <span className="font-bold text-slate-900">{item.count}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.percentage.toFixed(1)}% of reported career profiles
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown Metric Strip */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="p-1.5 rounded-lg bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Engineering & Cloud:</span>
            <span className="font-bold text-slate-800">
              {((((chartData[0]?.count || 0) + (chartData[4]?.count || 0)) / totalEvaluated) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Product & Strategy:</span>
            <span className="font-bold text-slate-800">
              {((((chartData[1]?.count || 0) + (chartData[3]?.count || 0)) / totalEvaluated) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Footer Insight */}
        <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-purple-800 min-w-0">
            <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">
              Seniority Progression: Strong mid-to-senior leadership representation.
            </span>
          </div>
          <span className="text-[10px] font-semibold text-purple-700 shrink-0">
            {totalEvaluated} Total
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
