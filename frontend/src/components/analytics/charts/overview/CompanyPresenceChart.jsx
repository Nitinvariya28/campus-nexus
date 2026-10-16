import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
} from 'recharts';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';
import { CHART_PALETTE } from '../../../../constants/analytics/chartTheme';

/**
 * CompanyPresenceChart Component (Visual 6)
 * Ranked horizontal bar chart displaying top corporate hiring partners.
 * Strictly consumes live API data. Zero mock fallback arrays.
 * Backed by data.common.company_landscape.company_presence
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function CompanyPresenceChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 h-3 bg-slate-200 rounded" />
              <div
                className="h-4 bg-slate-100 rounded"
                style={{ width: `${80 - i * 10}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  const rawPresence = data?.common?.company_landscape?.company_presence || [];

  const chartData = rawPresence
    .map((c) => ({
      name: c.company_name || 'Company',
      score: Number(c.total_presence_score) || 0,
      alumni: Number(c.alumni_count) || 0,
      placements: Number(c.placements_count) || 0,
      interviews: Number(c.interviews_count) || 0,
    }))
    .filter((c) => c.score > 0 || c.alumni > 0 || c.placements > 0)
    .slice(0, 10);

  // If no data returned from API, render empty state
  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Top Recruiter Presence"
        subtitle="Institutional partner rankings"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="Recruiter Data Not Available"
          message="Technical issue or no partner recruitment records found for this visualization."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Top Recruiter Presence"
      subtitle="Institutional partner rankings"
      heightClass="h-64"
    >
      <div className="w-full h-full flex flex-col justify-between">
        <div className="w-full flex-1 min-h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 28, left: 10, bottom: -10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10, fill: CHART_PALETTE.axisText }}
                tickLine={false}
                axisLine={false}
                width={68}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 min-w-[120px] text-xs">
                      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                        {item.name}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-slate-600">
                        <span>Presence Score:</span>
                        <strong className="text-indigo-600 font-bold">{item.score}</strong>
                      </div>
                      {item.alumni > 0 && (
                        <div className="flex items-center justify-between gap-3 text-slate-500 text-[11px] mt-0.5">
                          <span>Alumni Hired:</span>
                          <span>{item.alumni}</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="score" fill="#2563EB" radius={[0, 4, 4, 0]} maxBarSize={14}>
                <LabelList
                  dataKey="score"
                  position="right"
                  fill="#64748B"
                  fontSize={10}
                  fontWeight={600}
                />
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index < 3 ? '#2563EB' : index < 6 ? '#4F46E5' : '#6366F1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
          <span>Campus Intake Score</span>
          <span className="font-medium text-slate-500">{chartData.length} Partners</span>
        </div>
      </div>
    </ChartCard>
  );
}
