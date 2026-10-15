import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_PALETTE } from '../../../constants/analytics/chartTheme';

/**
 * Ranked Horizontal Bar Chart Component
 * Used for top hiring companies ranking and campus tech stack frequencies.
 */
export default function HorizontalBarChart({
  data = [],
  nameKey = 'name',
  valueKey = 'value',
  barColor = CHART_PALETTE.primary[0],
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: CHART_PALETTE.axisText }}
          tickLine={false}
          axisLine={{ stroke: CHART_PALETTE.grid }}
        />
        <YAxis
          dataKey={nameKey}
          type="category"
          tick={{ fontSize: 11, fill: CHART_PALETTE.axisText }}
          tickLine={false}
          axisLine={{ stroke: CHART_PALETTE.grid }}
          width={80}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar
          dataKey={valueKey}
          fill={barColor}
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
