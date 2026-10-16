import React from 'react';
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
import { Building2, Target } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const DEPT_ABBR = {
  'Computer Science & Engineering': 'CSE',
  'Artificial Intelligence & Data Science': 'AI & DS',
  'Civil Engineering': 'Civil',
  'Mechanical Engineering': 'Mech',
  'Electronics & Communication Engineering': 'ECE',
  'Electrical Engineering': 'Electrical',
  'Information Technology': 'IT',
  'Chemical Engineering': 'Chem',
  'Biotechnology': 'Biotech',
};

/**
 * DepartmentATSBenchmarkChart Component (Visual 2 - Student Dashboard Row 2 Col 2)
 * Horizontal bar chart comparing automated screening readiness across academic departments
 * against the 75.0 Institutional Day-1 corporate standard.
 * Strictly consumes live API data from data.student.resume_cohort_health.department_distribution.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function DepartmentATSBenchmarkChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-12 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" style={{ width: `${85 - i * 8}%` }} />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const deptList = data?.student?.resume_cohort_health?.department_distribution || [];

  if (!deptList || deptList.length === 0) {
    return (
      <ChartCard
        title="Department ATS Readiness"
        subtitle="Screening scores compared against institutional 75.0 target"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Department Data Unavailable"
          message="Technical issue: Department ATS benchmark data is not available."
        />
      </ChartCard>
    );
  }

  // Format and sort highest to lowest average_ats_score
  const chartData = deptList
    .map((item) => {
      const fullName = item.department__name || `Dept #${item.department_id}`;
      const shortName = DEPT_ABBR[fullName] || fullName.split(' ')[0];
      const score = Number(item.average_ats_score) || 0;

      return {
        id: item.department_id,
        fullName,
        shortName,
        score: parseFloat(score.toFixed(1)),
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <ChartCard
      title="Department ATS Benchmark"
      subtitle="Mean screening score vs 75.0 corporate target"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Target className="w-3 h-3 text-indigo-600" />
          Target: 75.0
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
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
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  const isPassing = item.score >= 75.0;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800">{item.fullName}</div>
                      <div className="flex items-center justify-between gap-4 mt-1.5 text-slate-600">
                        <span>Average ATS Score:</span>
                        <span className="font-bold text-slate-900">{item.score} / 100</span>
                      </div>
                      <div className="mt-1 text-[10px]">
                        {isPassing ? (
                          <span className="text-emerald-600 font-semibold">✓ Meets Target (≥75)</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">
                            ⚠️ {(75.0 - item.score).toFixed(1)} pts below corporate threshold
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                x={75}
                stroke="#6366F1"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Target 75',
                  position: 'top',
                  fill: '#4F46E5',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={14}>
                {chartData.map((entry, index) => {
                  const fill =
                    entry.score >= 75
                      ? '#10B981'
                      : entry.score >= 70
                      ? '#4F46E5'
                      : '#F59E0B';
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insight Legend */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Highest:</span>
            <span className="font-semibold text-slate-800">
              {chartData[0]?.fullName} ({chartData[0]?.score})
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Dashed: 75.0 Standard
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
