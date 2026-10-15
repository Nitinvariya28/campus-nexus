import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_PALETTE } from '../../../constants/analytics/chartTheme';

/**
 * Distribution Donut Chart Component
 * Used for platform census, industry breakdown, and skill cluster distributions.
 * Supports custom slice colors via item.color with fallback to CHART_PALETTE.primary.
 */
export default function DistributionDonutChart({ data = [], centerLabel = 'Total' }) {
  const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="82%"
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_PALETTE.primary[index % CHART_PALETTE.primary.length]}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Centered Total KPI Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {centerLabel}
        </span>
        <span className="text-xl font-bold text-slate-900 tracking-tight">
          {total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
