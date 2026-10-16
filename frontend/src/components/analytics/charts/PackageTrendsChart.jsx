import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ChartCard from './ChartCard';
import ChartEmptyState from './ChartEmptyState';
import { CHART_PALETTE } from '../../../constants/analytics/chartTheme';

/**
 * PackageTrendsChart Component (Visual 4)
 * Renders the YoY Package Growth Multi-Line Chart.
 * Strictly consumes live API data. Zero mock fallback arrays.
 * Backed by data.common.placement_snapshot.trends.yearly_summary
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function PackageTrendsChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="w-full h-44 bg-slate-100 rounded-lg my-auto" />
        <div className="flex justify-end gap-4 pt-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-3 w-20 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  const rawTrends = data?.common?.placement_snapshot?.trends?.yearly_summary || [];

  const chartData = [...rawTrends]
    .filter((item) => item && item.placement_year)
    .sort((a, b) => a.placement_year - b.placement_year)
    .map((item) => ({
      year: String(item.placement_year),
      'Avg Package': item.average_lpa ? Number(item.average_lpa) : null,
      'Max Package': item.maximum_lpa ? Number(item.maximum_lpa) : null,
    }));

  // If no data returned from API, render empty state
  if (chartData.length === 0) {
    return (
      <ChartCard
        title="YoY Package Growth"
        subtitle="Annual peak and average salary trajectory"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="Trends Data Not Available"
          message="Technical issue or no yearly placement records found for this visualization."
        />
      </ChartCard>
    );
  }

  const hasMultipleYears = chartData.length > 1;
  const isUpward =
    hasMultipleYears &&
    (chartData[chartData.length - 1]['Avg Package'] || 0) >=
      (chartData[0]['Avg Package'] || 0);

  return (
    <ChartCard
      title="YoY Package Growth"
      subtitle="Annual peak and average salary trajectory"
      heightClass="h-64"
    >
      <div className="w-full h-full flex flex-col justify-between">
        <div className="w-full flex-1 min-h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: CHART_PALETTE.axisText }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: CHART_PALETTE.axisText }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                unit="L"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 min-w-[130px] text-xs">
                      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                        Batch {label}
                      </div>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}:</span>
                          </span>
                          <strong className="text-slate-900 font-bold">
                            ₹ {Number(entry.value).toFixed(1)} LPA
                          </strong>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 10, paddingBottom: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Avg Package"
                name="Avg Package"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2563EB' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Max Package"
                name="Max Package"
                stroke="#7C3AED"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#7C3AED' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
          <span>{chartData.length} Placement Cycles Recorded</span>
          {hasMultipleYears ? (
            <span className={`font-medium ${isUpward ? 'text-emerald-600' : 'text-slate-500'}`}>
              {isUpward ? '▲ Upward Trajectory' : '● Historical Overview'}
            </span>
          ) : (
            <span className="font-medium text-slate-500">Cycle Overview</span>
          )}
        </div>
      </div>
    </ChartCard>
  );
}
