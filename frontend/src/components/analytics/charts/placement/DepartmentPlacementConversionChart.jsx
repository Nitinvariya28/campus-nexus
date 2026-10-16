import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Award, Target, TrendingUp } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const DEPT_ABBR = {
  'Computer Science & Engineering': 'CSE',
  'Information Technology': 'IT',
  'Electronics & Communication Engineering': 'ECE',
  'Artificial Intelligence & Data Science': 'AI & DS',
  'Electrical Engineering': 'EE',
  'Mechanical Engineering': 'ME',
  'Civil Engineering': 'CE',
};

/**
 * DepartmentPlacementConversionChart Component (Visual 1 - Row 2 Col 1: 4 cols)
 * Interactive Horizontal Bar Chart measuring placement conversion rates across
 * engineering departments against institutional benchmark target lines.
 * Strictly consumes live API data from data.placement_cell.cohort_outcomes.placement_coverage.by_department.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function DepartmentPlacementConversionChart({ data, loading = false }) {
  const [targetBenchmark, setTargetBenchmark] = useState(75); // 75% or 85%

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const rawDepts =
    data?.placement_cell?.cohort_outcomes?.placement_coverage?.by_department ||
    data?.common?.placement_snapshot?.department_outcomes ||
    [];

  if (!rawDepts || rawDepts.length === 0) {
    return (
      <ChartCard
        title="Department Placement Conversion"
        subtitle="Placement conversion percentage across departments"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Department Data Unavailable"
          message="Technical issue: Department placement coverage data is not available."
        />
      </ChartCard>
    );
  }

  const chartData = rawDepts.slice(0, 7).map((item) => {
    const fullName = item.department__name || item.student__department__name || 'Unknown';
    const shortName = DEPT_ABBR[fullName] || fullName.split(' ')[0];
    const eligible = item.eligible_students || 100;
    const placed = item.placed_students || item.total_offers || 0;
    const rate = item.coverage_pct != null
      ? Number(item.coverage_pct)
      : eligible > 0 ? (placed / eligible) * 100 : 0;

    const roundedRate = Number(rate.toFixed(1));

    let barColor = '#10B981'; // Emerald >= target
    if (roundedRate < targetBenchmark - 15) {
      barColor = '#EF4444'; // Rose
    } else if (roundedRate < targetBenchmark) {
      barColor = '#F59E0B'; // Amber
    }

    return {
      fullName,
      name: shortName,
      eligible,
      placed,
      rate: roundedRate,
      color: barColor,
    };
  });

  const topDept = [...chartData].sort((a, b) => b.rate - a.rate)[0];

  return (
    <ChartCard
      title="Department Conversion"
      subtitle="Placement rate % against target benchmark"
      heightClass="h-auto"
      actionSlot={
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium">
          <button
            type="button"
            onClick={() => setTargetBenchmark(75)}
            className={`px-1.5 py-0.5 rounded transition-all ${
              targetBenchmark === 75
                ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            75% Goal
          </button>
          <button
            type="button"
            onClick={() => setTargetBenchmark(85)}
            className={`px-1.5 py-0.5 rounded transition-all ${
              targetBenchmark === 85
                ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            85% Elite
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Horizontal Bar Chart */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
                        {item.fullName}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-slate-600">
                        <span>Placement Rate:</span>
                        <strong className="text-slate-900">{item.rate}%</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.placed} placed of {item.eligible} eligible students
                      </div>
                      <div className="text-[10px] text-indigo-600 mt-1 font-medium">
                        Target: {targetBenchmark}% ({item.rate >= targetBenchmark ? 'Target Achieved' : `${(targetBenchmark - item.rate).toFixed(1)}% Gap`})
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                x={targetBenchmark}
                stroke="#E11D48"
                strokeDasharray="3 3"
                label={{
                  value: `${targetBenchmark}% Target`,
                  fill: '#E11D48',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Status Strip */}
        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 px-1 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" /> &gt;= {targetBenchmark}% Target
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Critical Attention
          </span>
        </div>

        {/* Footer Insight Callout */}
        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 min-w-0">
            <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Leading Branch: <strong className="text-emerald-900">{topDept?.fullName}</strong>
            </span>
          </div>
          <span className="font-bold text-emerald-700 shrink-0">
            {topDept?.rate}% Placed
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
