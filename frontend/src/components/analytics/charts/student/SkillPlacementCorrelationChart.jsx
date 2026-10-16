import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Award, CheckCircle } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const SKILL_ABBR = {
  'Data Structures & Algorithms (DSA)': 'DSA',
  'Object-Oriented Programming (OOP)': 'OOP',
  'Amazon Web Services (AWS)': 'AWS',
  'Continuous Integration and Continuous Deployment': 'CI/CD',
};

/**
 * SkillPlacementCorrelationChart Component (Visual 5 - Student Dashboard Row 3 Col 2)
 * Dual-axis Composed Chart displaying Placed vs Unplaced students possessing key technical competencies,
 * with an overlay trend line indicating the actual placement success rate (%) for each skill.
 * Strictly consumes live API data from data.common.skills_pulse.student_associations.placement_correlation.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function SkillPlacementCorrelationChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-56 bg-slate-100 rounded-lg my-auto" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const pulse = data?.common?.skills_pulse || {};
  const rawCorrelation = pulse.student_associations?.placement_correlation || [];

  if (!rawCorrelation || rawCorrelation.length === 0) {
    return (
      <ChartCard
        title="Skill-to-Placement Correlation"
        subtitle="Placed vs unplaced students across technical skills"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Placement Correlation Unavailable"
          message="Technical issue: Skill-to-placement correlation data is not available."
        />
      </ChartCard>
    );
  }

  // Pick top 6 skills
  const chartData = rawCorrelation.slice(0, 6).map((item) => {
    const rawName = item.skill__name;
    const shortName = SKILL_ABBR[rawName] || rawName;
    const placed = Number(item.placed_users) || 0;
    const unplaced = Number(item.unplaced_users) || 0;
    const rate = Number(item.placement_rate_pct) || 0;

    return {
      skill: shortName,
      fullName: rawName,
      placed,
      unplaced,
      total: Number(item.users_with_skill) || placed + unplaced,
      rate: parseFloat(rate.toFixed(1)),
    };
  });

  const topSuccessSkill = [...chartData].sort((a, b) => b.rate - a.rate)[0];

  return (
    <ChartCard
      title="Skill-to-Placement Correlation"
      subtitle="Placed vs unplaced counts & conversion rate by skill"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Award className="w-3 h-3 text-emerald-600" />
          Top Rate: {topSuccessSkill?.skill} ({topSuccessSkill?.rate}%)
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="skill"
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fill: '#D97706', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800">{item.fullName}</div>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between gap-4 text-emerald-700">
                          <span>Placed Candidates:</span>
                          <span className="font-bold">{item.placed}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-500">
                          <span>Unplaced Candidates:</span>
                          <span className="font-bold">{item.unplaced}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 font-semibold text-amber-700">
                          <span>Placement Rate:</span>
                          <span>{item.rate}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
              />
              <Bar
                yAxisId="left"
                dataKey="placed"
                name="Placed"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                barSize={12}
              />
              <Bar
                yAxisId="left"
                dataKey="unplaced"
                name="Unplaced"
                fill="#94A3B8"
                radius={[4, 4, 0, 0]}
                barSize={12}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rate"
                name="Placement %"
                stroke="#D97706"
                strokeWidth={2}
                dot={{ r: 3, fill: '#D97706' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Highest Conversion Callout */}
        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">Highest Conversion Skill:</span>
            <span className="font-bold">{topSuccessSkill?.fullName}</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700">
            {topSuccessSkill?.rate}% Placed
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
