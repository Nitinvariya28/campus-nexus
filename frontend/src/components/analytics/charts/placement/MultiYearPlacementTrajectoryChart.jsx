import React, { useState } from 'react';
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
import { History, TrendingUp, Calendar } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

/**
 * MultiYearPlacementTrajectoryChart Component (Visual 5 - Full Width: 12 cols)
 * Interactive Dual-Axis Composed Chart tracking annual placement volume growth
 * alongside average CTC package trajectory across consecutive recruitment cycles.
 * Strictly consumes live API data from data.placement_cell.placement_kpis.trends.yearly_summary.
 *
 * Designed with generous horizontal spacing between YoY cycles and dedicated Y-axis margins.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function MultiYearPlacementTrajectoryChart({ data, loading = false }) {
  const [viewMetric, setViewMetric] = useState('BOTH'); // 'BOTH' | 'OFFERS' | 'CTC'

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
  const yearlySummary = placementKpis.trends?.yearly_summary || [];

  if (!yearlySummary || yearlySummary.length === 0) {
    return (
      <ChartCard
        title="Placement Trajectory Trends"
        subtitle="Multi-year recruitment volume & CTC trajectory"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Trajectory Data Unavailable"
          message="Multi-year placement trajectory trends data is currently not available for the selected filters."
        />
      </ChartCard>
    );
  }

  const chartData = yearlySummary.map((item) => {
    const year = item.placement_year;
    const offers = Number(item.total_offers) || 0;
    const avgLpa = item.average_lpa != null ? Number(item.average_lpa) : 0;
    const maxLpa = item.maximum_lpa != null ? Number(item.maximum_lpa) : 0;
    const students = Number(item.distinct_students) || offers;
    const companies = Number(item.distinct_companies) || 0;
    const growth = item.yoy_offer_growth_pct != null ? Number(item.yoy_offer_growth_pct) : 0;

    return {
      year: `Cycle ${year}`,
      rawYear: year,
      offers,
      avgLpa,
      maxLpa,
      students,
      companies,
      growth,
    };
  });

  const latestCycle = chartData[chartData.length - 1];

  return (
    <ChartCard
      title="Multi-Year Placement Trajectory"
      subtitle="Annual placement offer volume & average package trajectory"
      heightClass="h-auto"
      actionSlot={
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium">
          <button
            type="button"
            onClick={() => setViewMetric('BOTH')}
            className={`px-2 py-0.5 rounded transition-all ${
              viewMetric === 'BOTH'
                ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Both
          </button>
          <button
            type="button"
            onClick={() => setViewMetric('OFFERS')}
            className={`px-2 py-0.5 rounded transition-all ${
              viewMetric === 'OFFERS'
                ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Offers
          </button>
          <button
            type="button"
            onClick={() => setViewMetric('CTC')}
            className={`px-2 py-0.5 rounded transition-all ${
              viewMetric === 'CTC'
                ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Avg CTC
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Composed Chart with spacious padding and margins */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 18, right: 35, left: 10, bottom: 6 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="year"
                padding={{ left: 32, right: 32 }}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={viewMetric !== 'CTC' ? { value: 'Offers', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10, offset: 0 } : null}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                unit="L"
                width={48}
                tick={{ fill: '#059669', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={
                  viewMetric !== 'OFFERS'
                    ? {
                        value: '₹ LPA',
                        angle: 90,
                        position: 'insideRight',
                        offset: 4,
                        fill: '#059669',
                        fontSize: 10,
                        style: { textAnchor: 'middle' },
                      }
                    : null
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-xl p-3 text-xs min-w-56">
                      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-900">{item.year}</span>
                        {item.growth !== 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.growth > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {item.growth > 0 ? `+${item.growth}% YoY` : `${item.growth}% YoY`}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4 text-slate-600">
                          <span>Total Offers:</span>
                          <strong className="text-indigo-600 font-bold">{item.offers} offers</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-600">
                          <span>Average Package:</span>
                          <strong className="text-emerald-600 font-bold">₹ {item.avgLpa} LPA</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-600">
                          <span>Peak Package:</span>
                          <strong className="text-amber-600 font-bold">₹ {item.maxLpa} LPA</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                          {item.companies} hiring companies · {item.students} placed candidates
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
              {(viewMetric === 'BOTH' || viewMetric === 'OFFERS') && (
                <Bar
                  yAxisId="left"
                  dataKey="offers"
                  name="Total Offers"
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                  maxBarSize={22}
                />
              )}
              {(viewMetric === 'BOTH' || viewMetric === 'CTC') && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgLpa"
                  name="Average CTC (₹ LPA)"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insight Callout */}
        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 min-w-0">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Latest Cycle ({latestCycle?.year}): <strong className="text-emerald-900 font-bold">{latestCycle?.offers} offers</strong> at <strong className="text-emerald-900 font-bold">₹ {latestCycle?.avgLpa} LPA</strong> average.
            </span>
          </div>
          <span className="font-bold text-emerald-700 shrink-0">
            {chartData.length} Cycles Tracked
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
