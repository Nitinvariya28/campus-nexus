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
import ChartTooltip from './ChartTooltip';
import ChartEmptyState from './ChartEmptyState';
import { CHART_PALETTE } from '../../../constants/analytics/chartTheme';

/**
 * GrowthTrajectoryChart Component (Visual 2)
 * Renders the Onboarding & Growth Trajectory multi-line chart across all three institutional cohorts.
 * Strictly consumes live API data. Zero mock fallback arrays.
 * Backed by data.common.platform_overview.monthly_growth / growth_trend
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function GrowthTrajectoryChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-72 bg-slate-100 rounded" />
        </div>
        <div className="w-full h-44 bg-slate-100 rounded-lg my-auto" />
        <div className="flex justify-end gap-4 pt-2">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  const monthlyGrowth =
    data?.common?.platform_overview?.monthly_growth ||
    data?.common?.platform_overview?.growth_trend ||
    [];

  const monthsMap = {};
  monthlyGrowth.forEach((item) => {
    if (!item.month) return;
    if (!monthsMap[item.month]) {
      const [year, monthNum] = item.month.split('-');
      const date = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
      const displayMonth = !isNaN(date.getTime())
        ? date.toLocaleDateString('en-US', { month: 'short' })
        : item.month;

      monthsMap[item.month] = {
        month: item.month,
        displayMonth,
        Students: 0,
        Alumni: 0,
        'Placement Cell': 0,
      };
    }

    const count = Number(item.new_users ?? item.count) || 0;
    if (item.role === 'STUDENT' || item.STUDENT) {
      monthsMap[item.month].Students += item.STUDENT ?? count;
    }
    if (item.role === 'ALUMNI' || item.ALUMNI) {
      monthsMap[item.month].Alumni += item.ALUMNI ?? count;
    }
    if (item.role === 'PLACEMENT_CELL' || item.PLACEMENT_CELL) {
      monthsMap[item.month]['Placement Cell'] += item.PLACEMENT_CELL ?? count;
    }
  });

  const chartData = Object.values(monthsMap);

  // If no data returned from API, render empty state
  if (chartData.length === 0) {
    return (
      <ChartCard
        title="Onboarding & Growth Trajectory"
        subtitle="Monthly member registrations across student, alumni, and staff cohorts"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="Growth Data Not Available"
          message="Technical issue or no monthly registration records available for the selected range."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Onboarding & Growth Trajectory"
      subtitle="Monthly member registrations across student, alumni, and staff cohorts"
      heightClass="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
          <XAxis
            dataKey="displayMonth"
            tick={{ fontSize: 11, fill: CHART_PALETTE.axisText }}
            tickLine={false}
            axisLine={{ stroke: '#CBD5E1' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_PALETTE.axisText }}
            tickLine={false}
            axisLine={{ stroke: '#CBD5E1' }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
          />

          <Line
            type="monotone"
            dataKey="Students"
            name="Students"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#2563EB' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Alumni"
            name="Alumni"
            stroke="#7C3AED"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#7C3AED' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Placement Cell"
            name="Placement Cell"
            stroke="#059669"
            strokeWidth={2}
            dot={{ r: 3, fill: '#059669' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
