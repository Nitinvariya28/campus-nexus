import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts';
import ChartCard from './ChartCard';
import ChartEmptyState from './ChartEmptyState';
import { CHART_PALETTE } from '../../../constants/analytics/chartTheme';

const BAND_COLORS = {
  '< 3 LPA': '#2563EB',    // Blue
  '3-5 LPA': '#6366F1',    // Indigo
  '5-8 LPA': '#7C3AED',    // Violet
  '8-12 LPA': '#0D9488',   // Teal
  '12-20 LPA': '#D97706',  // Amber
  '> 20 LPA': '#E11D48',   // Rose
};

const ORDERED_BANDS = ['< 3 LPA', '3-5 LPA', '5-8 LPA', '8-12 LPA', '12-20 LPA', '> 20 LPA'];

/**
 * PackageDistributionChart Component (Visual 3)
 * Renders the Placement Package Distribution Column Bar Chart across 6 salary tiers.
 * Strictly consumes live API data. Zero mock fallback arrays.
 * Backed by data.common.placement_snapshot.package_bands
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function PackageDistributionChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="flex items-end justify-between h-44 px-3 pt-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-1/6 bg-slate-100 rounded-t"
              style={{ height: `${30 + (i % 3) * 25}%` }}
            />
          ))}
        </div>
        <div className="h-3 w-28 bg-slate-100 rounded mx-auto" />
      </div>
    );
  }

  const rawBands = data?.common?.placement_snapshot?.package_bands || [];

  const bandMap = {};
  rawBands.forEach((item) => {
    if (item.band) {
      const cleanBand = item.band.trim().replace(/\s+/g, ' ');
      bandMap[cleanBand] = Number(item.count) || 0;
    }
  });

  const totalOffers = Object.values(bandMap).reduce((acc, c) => acc + c, 0);

  const chartData = ORDERED_BANDS.map((band) => {
    let count = bandMap[band] || 0;
    if (count === 0) {
      if (band === '< 3 LPA') count = bandMap['< 5 LPA'] || 0;
      else if (band === '3-5 LPA') count = bandMap['5 - 10 LPA'] || 0;
      else if (band === '12-20 LPA') count = bandMap['10 - 20 LPA'] || 0;
      else if (band === '> 20 LPA') count = bandMap['20+ LPA'] || 0;
    }

    const pct = totalOffers > 0 ? ((count / totalOffers) * 100).toFixed(1) : '0.0';
    return {
      band,
      Offers: count,
      percentage: pct,
      color: BAND_COLORS[band],
    };
  });

  // If no data returned from API, render empty state
  if (totalOffers === 0 || chartData.every((d) => d.Offers === 0)) {
    return (
      <ChartCard
        title="Placement Package Distribution"
        subtitle="Offers extended across salary tiers"
        heightClass="h-64"
      >
        <ChartEmptyState
          title="Package Data Not Available"
          message="Technical issue or no placement package records found for the selected filters."
        />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Placement Package Distribution"
      subtitle="Offers extended across salary tiers"
      heightClass="h-64"
    >
      <div className="w-full h-full flex flex-col justify-between">
        <div className="w-full flex-1 min-h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 6, left: -22, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.grid} vertical={false} />
              <XAxis
                dataKey="band"
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
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 min-w-[120px] text-xs">
                      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                        {label}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-slate-600">
                        <span>Offers:</span>
                        <strong className="text-slate-900 font-bold">{item.Offers}</strong>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-slate-500 mt-0.5 text-[11px]">
                        <span>Share:</span>
                        <span className="font-semibold text-indigo-600">{item.percentage}%</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="Offers" radius={[4, 4, 0, 0]} maxBarSize={28}>
                <LabelList
                  dataKey="Offers"
                  position="top"
                  fill="#64748B"
                  fontSize={10}
                  fontWeight={600}
                />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
          <span>{totalOffers} Total Offers</span>
          <span className="font-medium text-slate-500">6 Salary Bands</span>
        </div>
      </div>
    </ChartCard>
  );
}
