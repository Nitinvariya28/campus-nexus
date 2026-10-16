import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ChartCard from '../ChartCard';
import ChartTooltip from '../ChartTooltip';
import ChartEmptyState from '../ChartEmptyState';

/**
 * PopulationCensusChart Component (Visual 1)
 * Donut Chart with centered total and detailed side-by-side role breakdown table.
 * Strictly consumes live API data. Zero mock fallback numbers.
 * Backed by data.common.platform_overview.role_breakdown
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function PopulationCensusChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4 items-center my-auto">
          <div className="w-36 h-36 rounded-full border-8 border-slate-100 mx-auto" />
          <div className="space-y-3">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
          </div>
        </div>
        <div className="h-3 w-40 bg-slate-100 rounded" />
      </div>
    );
  }

  const roleBreakdown = data?.common?.platform_overview?.role_breakdown || [];
  const snapshot = data?.common?.platform_overview?.platform_snapshot || {};
  let totalUsers = Number(data?.common?.platform_overview?.total_users ?? 0);

  // Extract counts by role directly from API
  let studentCount = 0;
  let alumniCount = 0;
  let staffCount = 0;

  roleBreakdown.forEach((item) => {
    if (item.role === 'STUDENT') {
      studentCount = Number(item.count) || 0;
    } else if (item.role === 'ALUMNI') {
      alumniCount = Number(item.count) || 0;
    } else if (item.role === 'PLACEMENT_CELL') {
      staffCount = Number(item.count) || 0;
    }
  });

  if (studentCount === 0 && snapshot.total_students) studentCount = Number(snapshot.total_students);
  if (alumniCount === 0 && snapshot.total_alumni) alumniCount = Number(snapshot.total_alumni);
  if (totalUsers === 0) totalUsers = studentCount + alumniCount + staffCount;

  const chartData = [
    { name: 'Students', value: studentCount, color: '#2563EB' }, // Royal Blue
    { name: 'Alumni', value: alumniCount, color: '#7C3AED' },   // Purple / Violet
    { name: 'Placement Cell', value: staffCount, color: '#059669' }, // Emerald / Green
  ].filter((item) => item.value > 0);

  const totalCalculated = chartData.reduce((acc, curr) => acc + curr.value, 0);

  // If no data returned from API, render empty state
  if (chartData.length === 0 || totalUsers === 0) {
    return (
      <ChartCard
        title="User Population"
        subtitle="Registered platform members across institutional roles"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="User Census Not Available"
          message="Technical issue or no registered users recorded in the database."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="User Population"
      subtitle="Registered platform members across institutional roles"
      heightClass="h-64"
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 h-full items-center">
        {/* Left: Donut Chart with Centered KPI */}
        <div className="sm:col-span-7 relative h-56 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              {totalUsers.toLocaleString()}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Total Users
            </span>
          </div>
        </div>

        {/* Right: Detailed Role Breakdown Table */}
        <div className="sm:col-span-5 flex flex-col justify-center space-y-3 pr-2 border-l border-slate-100 pl-3">
          {chartData.map((role) => {
            const pct =
              totalCalculated > 0
                ? ((role.value / totalCalculated) * 100).toFixed(1)
                : '0.0';

            return (
              <div
                key={role.name}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="font-medium text-slate-700 truncate">{role.name}</span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                  <span className="text-slate-500 font-semibold">{pct}%</span>
                  <span className="font-bold text-slate-900 w-12 text-right">
                    {role.value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
