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
import ChartCard from './ChartCard';
import ChartEmptyState from './ChartEmptyState';
import { CHART_PALETTE } from '../../../constants/analytics/chartTheme';

/**
 * IndustryFootprintChart Component (Visual 7)
 * Clustered bar chart showing talent footprint across key industry sectors.
 * Strictly consumes live API data. Zero mock fallback arrays.
 * Backed by data.common.company_landscape.industry_presence_comparison
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function IndustryFootprintChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="flex items-end justify-between h-44 px-2 pt-6 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-1/4 flex gap-1 items-end h-full justify-center">
              <div className="w-2.5 bg-slate-200 rounded-t" style={{ height: `${40 + i * 15}%` }} />
              <div className="w-2.5 bg-slate-100 rounded-t" style={{ height: `${25 + i * 10}%` }} />
              <div className="w-2.5 bg-slate-200 rounded-t" style={{ height: `${20 + i * 8}%` }} />
            </div>
          ))}
        </div>
        <div className="h-3 w-28 bg-slate-100 rounded mx-auto" />
      </div>
    );
  }

  const rawComparison =
    data?.common?.company_landscape?.industry_presence_comparison ||
    data?.common?.company_landscape?.companies_by_industry ||
    [];

  const chartData = rawComparison
    .map((item) => {
      const sector = (item.industry || item.sector || item.name || '').trim();
      const alumni = Number(item.alumni_employed_count ?? item.alumni_count ?? 0);
      const placements = Number(item.recent_placements_count ?? item.placements_count ?? item.count ?? 0);
      return {
        sector,
        'Alumni Employed': alumni,
        'Recent Placements': placements,
        total: alumni + placements,
      };
    })
    .filter((item) => item.sector.length > 0 && item.total > 0)
    .slice(0, 6);

  // If no data returned from API, render empty state
  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Industry Footprint"
        subtitle="Talent distribution across corporate sectors"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="Industry Footprint Not Available"
          message="Technical issue or no industry footprint records found for this visualization."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Industry Footprint"
      subtitle="Talent distribution across corporate sectors"
      heightClass="h-64"
    >
      <div className="w-full h-full flex flex-col justify-between">
        <div className="w-full flex-1 min-h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
              <XAxis
                dataKey="sector"
                tick={{ fontSize: 10, fill: CHART_PALETTE.axisText }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: CHART_PALETTE.axisText }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 min-w-[130px] text-xs">
                      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                        {label}
                      </div>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}:</span>
                          </span>
                          <strong className="text-slate-900 font-bold">{entry.value}</strong>
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
                wrapperStyle={{ fontSize: 9, paddingBottom: 4 }}
              />
              <Bar dataKey="Alumni Employed" name="Alumni Employed" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={14} />
              <Bar dataKey="Recent Placements" name="Recent Placements" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
          <span>Cross-Sector Footprint</span>
          <span className="font-medium text-slate-500">{chartData.length} Sectors Active</span>
        </div>
      </div>
    </ChartCard>
  );
}
