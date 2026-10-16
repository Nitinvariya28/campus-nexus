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
  LabelList,
} from 'recharts';
import ChartCard from './ChartCard';
import ChartEmptyState from './ChartEmptyState';
import { CHART_PALETTE } from '../../../constants/analytics/chartTheme';

/**
 * Custom formatter for bar top labels (e.g. 1200 -> 1.2K)
 */
function formatBarLabel(val) {
  if (!val && val !== 0) return '';
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(val);
}

/**
 * Custom Tooltip for engagement metrics
 */
function EngagementTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-3 min-w-[150px] text-xs">
      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
        {label} Engagement
      </div>
      <div className="space-y-1.5">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span>{item.name}:</span>
            </span>
            <span className="font-bold text-slate-900 font-mono">
              {Number(item.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CommunityEngagementChart Component (Visual 9)
 * Grouped bar chart comparing platform discussions, comments, and reactions by user role with value annotations.
 * Strictly consumes live API data. Zero mock fallback arrays.
 * Backed by data.common.community_pulse.role_engagement
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function CommunityEngagementChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="flex items-end justify-between h-44 px-6 pt-6 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1/3 flex gap-1.5 items-end h-full justify-center">
              <div className="w-4 bg-slate-200 rounded-t" style={{ height: `${35 + i * 20}%` }} />
              <div className="w-4 bg-slate-100 rounded-t" style={{ height: `${50 + i * 15}%` }} />
              <div className="w-4 bg-slate-200 rounded-t" style={{ height: `${65 + i * 10}%` }} />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 pt-2">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  const rawEngagement = data?.common?.community_pulse?.role_engagement || [];

  const chartData = rawEngagement.map((r) => {
    let roleLabel = 'Students';
    if (r.role === 'ALUMNI') roleLabel = 'Alumni';
    else if (r.role === 'PLACEMENT_CELL') roleLabel = 'Placement Cell';
    else if (r.role === 'ADMIN') roleLabel = 'Admin';

    return {
      role: roleLabel,
      Posts: Number(r.posts_created) || 0,
      Comments: Number(r.comments_made) || 0,
      Likes: Number(r.likes_given) || 0,
    };
  });

  const totalInteractions = chartData.reduce(
    (acc, d) => acc + (d.Posts || 0) + (d.Comments || 0) + (d.Likes || 0),
    0
  );

  // If no data returned from API, render empty state
  if (chartData.length === 0 || totalInteractions === 0) {
    return (
      <ChartCard
        title="Community Engagement by Role"
        subtitle="Activity and interaction volume across platforms"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="Community Engagement Not Available"
          message="Technical issue or no interaction records found for this visualization."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Community Engagement by Role"
      subtitle="Activity and interaction volume across platforms"
      heightClass="h-64"
    >
      <div className="w-full h-full flex flex-col justify-between">
        <div className="w-full flex-1 min-h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              barGap={3}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
              <XAxis
                dataKey="role"
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fill: CHART_PALETTE.axisText, fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
                tick={{ fill: CHART_PALETTE.axisText, fontSize: 10 }}
                allowDecimals={false}
              />
              <Tooltip content={<EngagementTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '10px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="Posts" name="Posts" fill="#7C3AED" radius={[3, 3, 0, 0]} maxBarSize={16}>
                <LabelList
                  dataKey="Posts"
                  position="top"
                  formatter={formatBarLabel}
                  fill="#64748B"
                  fontSize={9}
                  fontWeight={600}
                />
              </Bar>
              <Bar dataKey="Comments" name="Comments" fill="#0284C7" radius={[3, 3, 0, 0]} maxBarSize={16}>
                <LabelList
                  dataKey="Comments"
                  position="top"
                  formatter={formatBarLabel}
                  fill="#64748B"
                  fontSize={9}
                  fontWeight={600}
                />
              </Bar>
              <Bar dataKey="Likes" name="Likes" fill="#F43F5E" radius={[3, 3, 0, 0]} maxBarSize={16}>
                <LabelList
                  dataKey="Likes"
                  position="top"
                  formatter={formatBarLabel}
                  fill="#64748B"
                  fontSize={9}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
          <span>Peer Interactions</span>
          <span className="font-medium text-slate-500">Posts · Comments · Likes</span>
        </div>
      </div>
    </ChartCard>
  );
}
