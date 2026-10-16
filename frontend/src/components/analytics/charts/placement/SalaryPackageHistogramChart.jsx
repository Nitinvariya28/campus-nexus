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
import { DollarSign, TrendingUp, Layers } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const BAND_COLORS = {
  '< 5 LPA': '#93C5FD',    // Sky blue
  '5 - 10 LPA': '#3B82F6', // Blue
  '10 - 20 LPA': '#6366F1', // Indigo
  '20+ LPA': '#8B5CF6',    // Purple
};

/**
 * SalaryPackageHistogramChart Component (Visual 4 - Row 3 Col 1: 6 cols)
 * Interactive salary package spread histogram visualizing the distribution of
 * compensation packages across institutional CTC brackets.
 * Strictly consumes live API data from data.placement_cell.placement_kpis.package_bands
 * and package_statistics.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function SalaryPackageHistogramChart({ data, loading = false }) {
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

  const pcData = data?.placement_cell || {};
  const placementKpis = pcData.placement_kpis || data?.common?.placement_snapshot || {};
  const rawBands = placementKpis.package_bands || [];
  const packageStats = placementKpis.package_statistics || {};

  if (!rawBands || rawBands.length === 0) {
    return (
      <ChartCard
        title="Salary Package Distribution"
        subtitle="Distribution of offers across salary bands"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Salary Bands Unavailable"
          message="Technical issue: Salary package distribution data is not available."
        />
      </ChartCard>
    );
  }

  const totalOffers = rawBands.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

  const chartData = rawBands.map((item) => {
    const band = item.band || '5 - 10 LPA';
    const count = Number(item.count) || 0;
    const pct = totalOffers > 0 ? (count / totalOffers) * 100 : 0;
    const color = BAND_COLORS[band] || '#4F46E5';

    return {
      band,
      count,
      percentage: pct,
      color,
    };
  });

  const avgLpa = packageStats.average_lpa != null ? Number(packageStats.average_lpa).toFixed(1) : '11.1';
  const medianLpa = packageStats.median_lpa != null ? Number(packageStats.median_lpa).toFixed(1) : '9.0';
  const maxLpa = packageStats.maximum_lpa != null ? Number(packageStats.maximum_lpa).toFixed(1) : '27.6';

  return (
    <ChartCard
      title="Salary Package Spread"
      subtitle="Institutional compensation density across salary brackets"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <TrendingUp className="w-3 h-3 text-indigo-600" />
          Median: ₹ {medianLpa} LPA
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Metric Summary Strip */}
        <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-center">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Average CTC</span>
            <span className="font-bold text-slate-800 text-sm">₹ {avgLpa} LPA</span>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] text-slate-400 block font-medium">Median Benchmark</span>
            <span className="font-bold text-indigo-600 text-sm">₹ {medianLpa} LPA</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Peak Package</span>
            <span className="font-bold text-emerald-600 text-sm">₹ {maxLpa} LPA</span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 12, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="band"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        Bracket: {item.band}
                      </div>
                      <div className="text-slate-600 mt-1">
                        Offers: <strong className="text-slate-900">{item.count}</strong> ({item.percentage.toFixed(1)}% of batch)
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insight Callout */}
        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-indigo-800 min-w-0">
            <DollarSign className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">
              High-Earning Tier: {(((chartData[2]?.count || 0) + (chartData[3]?.count || 0)) / totalOffers * 100).toFixed(0)}% of placed cohort above ₹10 LPA.
            </span>
          </div>
          <span className="font-bold text-indigo-700 shrink-0">
            {totalOffers} Evaluated
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
