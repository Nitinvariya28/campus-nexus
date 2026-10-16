import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Users, AlertTriangle, CheckCircle2, ArrowUpDown } from 'lucide-react';
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
  'Computer Engineering': 'CE (Comp)',
};

/**
 * DepartmentEligibilityVsPlacedChart Component (Visual 11 - Row 6 Col 2: 7 cols)
 * Operational TPO intelligence comparing eligible students against successfully placed students
 * to quantify remaining unplaced candidate inventory across academic departments.
 * Strictly consumes live API data from data.placement_cell.cohort_outcomes.placement_coverage.by_department.
 *
 * @param {object} data - Aggregated dashboard analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function DepartmentEligibilityVsPlacedChart({ data, loading = false }) {
  const [sortBy, setSortBy] = useState('unplaced'); // 'unplaced', 'placed', 'pct'

  // Extract raw departments
  const rawDepts = useMemo(() => {
    return (
      data?.placement_cell?.cohort_outcomes?.placement_coverage?.by_department || []
    );
  }, [data]);

  const processedData = useMemo(() => {
    if (!rawDepts || rawDepts.length === 0) return null;

    let totalEligible = 0;
    let totalPlaced = 0;
    let totalUnplaced = 0;

    const list = rawDepts.map((d) => {
      const name = d.department__name || 'Unknown Department';
      const shortName = DEPT_ABBR[name] || name.split(' ')[0] || name;
      const eligible = Number(d.eligible_students) || 0;
      const placed = Number(d.placed_students) || 0;
      const unplaced = Math.max(0, eligible - placed);
      const coveragePct =
        eligible > 0 ? Number(((placed / eligible) * 100).toFixed(1)) : 0;

      totalEligible += eligible;
      totalPlaced += placed;
      totalUnplaced += unplaced;

      return {
        fullName: name,
        department: shortName,
        eligible,
        placed,
        unplaced,
        coveragePct,
      };
    });

    // Apply sorting
    if (sortBy === 'unplaced') {
      list.sort((a, b) => b.unplaced - a.unplaced);
    } else if (sortBy === 'placed') {
      list.sort((a, b) => b.placed - a.placed);
    } else if (sortBy === 'pct') {
      list.sort((a, b) => b.coveragePct - a.coveragePct);
    }

    return {
      departments: list,
      totalEligible,
      totalPlaced,
      totalUnplaced,
      overallConversionRate:
        totalEligible > 0
          ? Number(((totalPlaced / totalEligible) * 100).toFixed(1))
          : 0,
    };
  }, [rawDepts, sortBy]);

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-60 bg-slate-200 rounded" />
          <div className="h-3 w-80 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    );
  }

  if (!processedData || !processedData.departments || processedData.departments.length === 0) {
    return (
      <ChartEmptyState
        title="Department Eligibility vs Placed Candidates"
        message="Technical issue: Departmental placement eligibility inventory data is not available."
      />
    );
  }

  return (
    <ChartCard
      title="Department Eligibility vs Placed Candidates"
      subtitle="Operational talent inventory tracking eligible cohort size, placed count, and unplaced backlog"
      badge={
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/60">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>{processedData.totalUnplaced} Candidates Unplaced</span>
        </div>
      }
      action={
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setSortBy('unplaced')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                sortBy === 'unplaced'
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Highest Gap
            </button>
            <button
              onClick={() => setSortBy('placed')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                sortBy === 'placed'
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Most Placed
            </button>
            <button
              onClick={() => setSortBy('pct')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                sortBy === 'pct'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              Rate %
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[320px] justify-between">
        {/* Executive inventory metrics strip */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Total Eligible Cohort
              </span>
              <span className="text-sm font-bold text-slate-900">
                {processedData.totalEligible} Students
              </span>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>

          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                Successfully Placed
              </span>
              <span className="text-sm font-bold text-emerald-950">
                {processedData.totalPlaced} Students
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded shadow-2xs">
              {processedData.overallConversionRate}%
            </span>
          </div>

          <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 block">
                Target Remediation Pool
              </span>
              <span className="text-sm font-bold text-amber-950">
                {processedData.totalUnplaced} Students
              </span>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        {/* Paired Bar Chart */}
        <div className="flex-1 w-full min-h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData.departments}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                domain={[0, 'dataMax + 5']}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
              />
              <YAxis
                dataKey="department"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                width={70}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg border border-slate-700 min-w-[190px]">
                        <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">
                          {row.fullName}
                        </p>
                        <div className="space-y-1">
                          <p className="text-blue-300 flex justify-between">
                            <span>Eligible Pool:</span>
                            <span className="font-bold">{row.eligible}</span>
                          </p>
                          <p className="text-emerald-400 flex justify-between">
                            <span>Placed Students:</span>
                            <span className="font-bold">{row.placed}</span>
                          </p>
                          <p className="text-amber-400 flex justify-between">
                            <span>Unplaced Backlog:</span>
                            <span className="font-bold">{row.unplaced}</span>
                          </p>
                          <p className="text-white flex justify-between pt-1 border-t border-slate-800">
                            <span>Conversion Rate:</span>
                            <span className="font-bold text-emerald-400">
                              {row.coveragePct}%
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '6px', fontSize: '11px' }}
              />
              <Bar
                name="Eligible Students"
                dataKey="eligible"
                fill="#94A3B8"
                radius={[0, 4, 4, 0]}
                barSize={10}
              />
              <Bar
                name="Placed Students"
                dataKey="placed"
                fill="#10B981"
                radius={[0, 4, 4, 0]}
                barSize={10}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Status Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real-time TPO departmental candidate remediation tracking</span>
          </div>
          <span className="font-semibold text-slate-700">
            {processedData.departments.length} Academic Departments
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
