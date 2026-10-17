import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { AlertTriangle, Wrench } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

/**
 * UnplacedMissingSkillsChart Component (Visual 3 - Student Dashboard Row 2 Col 3)
 * Displays top technical keywords flagged as missing across unplaced student resumes.
 * Guides university training & workshop priorities.
 * Strictly consumes live API data from data.student.resume_cohort_health.unplaced_missing_skills.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function UnplacedMissingSkillsChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" style={{ width: `${80 - i * 9}%` }} />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
    );
  }

  const rawSkills = data?.student?.resume_cohort_health?.unplaced_missing_skills || [];

  if (!rawSkills || rawSkills.length === 0) {
    return (
      <ChartCard
        title="Unplaced Missing Skills"
        subtitle="Critical competencies unplaced candidates lack in resumes"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Skill Deficit Data Unavailable"
          message="Technical issue: Unplaced student missing skills data is not available."
        />
      </ChartCard>
    );
  }

  // Take top 8 ranked deficit skills
  const chartData = rawSkills.slice(0, 8).map((item) => ({
    skill: item.skill,
    count: Number(item.flagged_count) || 0,
  }));

  const maxCount = chartData[0]?.count || 1;
  const topDeficitSkill = chartData[0]?.skill || '—';

  return (
    <ChartCard
      title="Unplaced Missing Skills"
      subtitle="Critical competencies unplaced candidates lack in resumes"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          Top Gap: {topDeficitSkill}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 30, left: 15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                domain={[0, Math.ceil(maxCount * 1.15)]}
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="skill"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-rose-500" />
                        {item.skill}
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1.5 text-slate-600">
                        <span>Unplaced Resumes Missing:</span>
                        <span className="font-bold text-rose-600">{item.count} students</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        High-priority keyword for targeted upskilling
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                {chartData.map((entry, index) => {
                  // Color gradient from urgent Rose to Amber
                  const fill =
                    index === 0
                      ? '#E11D48'
                      : index < 3
                      ? '#EF4444'
                      : index < 5
                      ? '#F97316'
                      : '#F59E0B';
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Workshop Callout */}
        <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 flex items-center justify-between text-xs">
          <span className="text-rose-800 font-medium">
            Immediate Skill Deficit:
          </span>
          <span className="font-bold text-rose-700">
            {chartData[0]?.count} candidates lack {chartData[0]?.skill}
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
