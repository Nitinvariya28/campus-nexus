import React from 'react';
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
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';
import { CHART_PALETTE } from '../../../../constants/analytics/chartTheme';

/**
 * Shortens formal department names for clean X-axis display.
 */
function getShortDeptName(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('computer')) return 'CSE';
  if (lower.includes('information')) return 'IT';
  if (lower.includes('electronic') || lower.includes('ece')) return 'ECE';
  if (lower.includes('mechanical')) return 'MECH';
  if (lower.includes('civil')) return 'CIVIL';
  if (lower.includes('chemical')) return 'CHEM';
  if (lower.includes('electrical')) return 'EE';
  if (lower.includes('ai') || lower.includes('data')) return 'AI&DS';
  return name.length > 8 ? `${name.substring(0, 6)}..` : name;
}

/**
 * DepartmentPlacementChart Component (Visual 5)
 * Dual-axis grouped bar chart comparing Total Offers (Royal Indigo) and Average LPA (Warm Amber/Gold).
 * Distinct color contrast eliminates repetitive blue/green palette.
 * Backed by data.common.placement_snapshot.department_outcomes
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function DepartmentPlacementChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="flex items-end justify-between h-44 px-4 pt-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1/6 flex gap-1 items-end h-full">
              <div className="w-1/2 bg-slate-200 rounded-t" style={{ height: `${40 + i * 10}%` }} />
              <div className="w-1/2 bg-slate-100 rounded-t" style={{ height: `${30 + i * 8}%` }} />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 pt-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  const rawOutcomes = data?.common?.placement_snapshot?.department_outcomes || [];

  // Consolidate duplicate branch aliases (e.g. Mechanical Eng. and Mechanical Engineering)
  const deptMap = {};
  rawOutcomes.forEach((d) => {
    if (!d || !d.student__department__name) return;
    const shortName = getShortDeptName(d.student__department__name);
    const offers = Number(d.total_offers) || 0;
    const avg = d.average_lpa ? Number(d.average_lpa) : 0;
    const max = d.maximum_lpa ? Number(d.maximum_lpa) : 0;

    if (!deptMap[shortName]) {
      deptMap[shortName] = {
        deptShort: shortName,
        deptFull: d.student__department__name,
        Offers: offers,
        totalLpaWeighted: avg * offers,
        peakLpa: max,
      };
    } else {
      deptMap[shortName].Offers += offers;
      deptMap[shortName].totalLpaWeighted += avg * offers;
      deptMap[shortName].peakLpa = Math.max(deptMap[shortName].peakLpa, max);
    }
  });

  const chartData = Object.values(deptMap)
    .map((item) => ({
      deptShort: item.deptShort,
      deptFull: item.deptFull,
      Offers: item.Offers,
      'Average LPA': item.Offers > 0 ? Number((item.totalLpaWeighted / item.Offers).toFixed(2)) : 0,
      peakLpa: Number(item.peakLpa.toFixed(2)),
    }))
    .filter((d) => d.Offers > 0)
    .sort((a, b) => b.Offers - a.Offers);

  // If no data returned from API, render empty state
  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Department Placement Performance"
        subtitle="Offers and average compensation comparison across academic branches"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="Department Outcomes Not Available"
          message="Technical issue or no department placement records found for this visualization."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Department Placement Performance"
      subtitle="Offers and average compensation comparison across academic branches"
      heightClass="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
          <XAxis
            dataKey="deptShort"
            tick={{ fontSize: 11, fill: CHART_PALETTE.axisText }}
            tickLine={false}
            axisLine={{ stroke: CHART_PALETTE.grid }}
          />
          {/* Left Axis: Total Offers (Indigo) */}
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#4F46E5' }}
            tickLine={false}
            axisLine={{ stroke: CHART_PALETTE.grid }}
          />
          {/* Right Axis: Average Package LPA (Warm Amber/Gold) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#D97706' }}
            tickLine={false}
            axisLine={{ stroke: CHART_PALETTE.grid }}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-3 min-w-[160px] text-xs">
                  <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1.5 truncate">
                    {item.deptFull}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        <span>Total Offers:</span>
                      </span>
                      <strong className="text-indigo-600 font-bold">{item.Offers}</strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>Average LPA:</span>
                      </span>
                      <strong className="text-amber-700 font-bold font-mono">
                        ₹{item['Average LPA']} LPA
                      </strong>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                        <span>Peak LPA:</span>
                      </span>
                      <strong className="text-purple-700 font-bold font-mono">
                        ₹{item.peakLpa} LPA
                      </strong>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
          />
          <Bar
            yAxisId="left"
            dataKey="Offers"
            name="Total Offers"
            fill="#4F46E5"
            radius={[4, 4, 0, 0]}
            barSize={18}
            maxBarSize={22}
          />
          <Bar
            yAxisId="right"
            dataKey="Average LPA"
            name="Average LPA (₹)"
            fill="#D97706"
            radius={[4, 4, 0, 0]}
            barSize={18}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
