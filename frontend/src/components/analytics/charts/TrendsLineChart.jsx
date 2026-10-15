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
import ChartTooltip from './ChartTooltip';
import { CHART_PALETTE } from '../../../constants/analytics/chartTheme';

/**
 * Multi-Line Trajectory Chart Component
 * Used for 5-Year placement vs. offers trends and longitudinal cohort tracking.
 */
export default function TrendsLineChart({ data = [], series = [] }) {
  const defaultSeries = [
    { key: 'placed', label: 'Placed Students', color: CHART_PALETTE.primary[1] }, // Emerald
    { key: 'offers', label: 'Total Offers', color: CHART_PALETTE.primary[0] },    // Corporate Blue
  ];

  const activeSeries = series.length > 0 ? series : defaultSeries;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: CHART_PALETTE.axisText }}
          tickLine={false}
          axisLine={{ stroke: CHART_PALETTE.grid }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_PALETTE.axisText }}
          tickLine={false}
          axisLine={{ stroke: CHART_PALETTE.grid }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
        />
        {activeSeries.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 1, fill: '#FFFFFF', stroke: s.color }}
            activeDot={{ r: 6, strokeWidth: 2, fill: s.color, stroke: '#FFFFFF' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
