import React, { useState } from 'react';
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
import { Award, TrendingUp, DollarSign } from 'lucide-react';
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
 * DepartmentSalaryComparisonChart Component (Visual 7 - Row 5 Col 1: 4 cols)
 * Dual Horizontal Bar Chart comparing average CTC against peak packages achieved
 * across academic departments.
 * Strictly consumes live API data from data.placement_cell.placement_kpis.department_outcomes.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function DepartmentSalaryComparisonChart({ data, loading = false }) {
  const [metricView, setMetricView] = useState('BOTH'); // 'BOTH' | 'AVG' | 'MAX'

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-60 bg-slate-100 rounded" />
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
    data?.placement_cell?.placement_kpis?.department_outcomes ||
    data?.common?.placement_snapshot?.department_outcomes ||
    [];

  if (!rawDepts || rawDepts.length === 0) {
    return (
      <ChartCard
        title="Department CTC Benchmark"
        subtitle="Average vs Peak CTC by academic branch"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="CTC Data Unavailable"
          message="Technical issue: Department salary outcome data is not available."
        />
      </ChartCard>
    );
  }

  const chartData = rawDepts.slice(0, 8).map((item) => {
    const fullName = item.student__department__name || item.department__name || 'Unknown';
    const shortName = DEPT_ABBR[fullName] || fullName.split(' ')[0];
    const avgLpa = item.average_lpa != null ? Number(item.average_lpa) : 0;
    const maxLpa = item.maximum_lpa != null ? Number(item.maximum_lpa) : 0;
    const offers = Number(item.total_offers) || 0;

    return {
      fullName,
      name: shortName,
      avgLpa,
      maxLpa,
      offers,
    };
  });

  const peakDept = [...chartData].sort((a, b) => b.maxLpa - a.maxLpa)[0];

  return (
    <ChartCard
      title="Department CTC Benchmark"
      subtitle="Average vs peak packages achieved across academic engineering branches"
      heightClass="h-auto"
      actionSlot={
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium">
          <button
            type="button"
            onClick={() => setMetricView('BOTH')}
            className={`px-1.5 py-0.5 rounded transition-all ${
              metricView === 'BOTH'
                ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Both
          </button>
          <button
            type="button"
            onClick={() => setMetricView('AVG')}
            className={`px-1.5 py-0.5 rounded transition-all ${
              metricView === 'AVG'
                ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Avg
          </button>
          <button
            type="button"
            onClick={() => setMetricView('MAX')}
            className={`px-1.5 py-0.5 rounded transition-all ${
              metricView === 'MAX'
                ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Peak
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Dual Horizontal Bar Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                unit="L"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
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
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4 text-slate-600">
                          <span>Average Package:</span>
                          <strong className="text-indigo-600">₹ {item.avgLpa} LPA</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-600">
                          <span>Peak Package:</span>
                          <strong className="text-emerald-600">₹ {item.maxLpa} LPA</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          Total offers: {item.offers}
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
              {(metricView === 'BOTH' || metricView === 'AVG') && (
                <Bar dataKey="avgLpa" name="Average LPA" fill="#6366F1" radius={[0, 3, 3, 0]} barSize={11} />
              )}
              {(metricView === 'BOTH' || metricView === 'MAX') && (
                <Bar dataKey="maxLpa" name="Peak LPA" fill="#10B981" radius={[0, 3, 3, 0]} barSize={11} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insight Callout */}
        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-indigo-800 min-w-0">
            <DollarSign className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">
              Peak Department: <strong className="text-indigo-900">{peakDept?.name}</strong> at <strong className="text-indigo-900">₹ {peakDept?.maxLpa} LPA</strong>.
            </span>
          </div>
          <span className="font-bold text-indigo-700 shrink-0">
            Top CTC
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
