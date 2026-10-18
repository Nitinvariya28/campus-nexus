import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Building2, TrendingUp } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const INDUSTRY_META = {
  Finance: {
    color: '#4F46E5', // Indigo
    subtext: 'Fintech & Capital Markets',
  },
  Healthcare: {
    color: '#10B981', // Emerald
    subtext: 'HealthTech & Bio-Systems',
  },
  IT: {
    color: '#06B6D4', // Cyan
    subtext: 'Enterprise Cloud & Software',
  },
  Consulting: {
    color: '#F59E0B', // Amber
    subtext: 'Strategy & Tech Advisory',
  },
  Other: {
    color: '#64748B', // Slate
    subtext: 'Diversified Industries',
  },
};

/**
 * AlumniIndustryDomainChart Component (Visual 2 - Row 2 Col 2)
 * Displays macro industry sector representation of the alumni workforce.
 * Styled with a top Donut chart and detailed sector breakdown list to perfectly
 * balance with sibling cards (Geographic Footprint & Career Specializations)
 * with zero vertical whitespace.
 *
 * Strictly consumes live API data from data.alumni.career_paths.company_insights.by_industry.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniIndustryDomainChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[280px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="w-28 h-28 rounded-full border-8 border-slate-100 mx-auto my-auto" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  const rawIndustries = data?.alumni?.career_paths?.company_insights?.by_industry || [];

  if (!rawIndustries || rawIndustries.length === 0) {
    return (
      <ChartCard
        title="Industry Sector Representation"
        subtitle="Alumni employment distribution across economic sectors"
        heightClass="h-[280px]"
      >
        <ChartEmptyState
          title="Industry Data Unavailable"
          message="Technical issue: Alumni industry sector representation data is not available."
        />
      </ChartCard>
    );
  }

  const totalAlumniInSectors = rawIndustries.reduce(
    (acc, curr) => acc + (Number(curr.count) || 0),
    0
  );

  const chartData = rawIndustries.map((item, idx) => {
    const name = item.current_company__industry || 'Other';
    const count = Number(item.count) || 0;
    const pct = totalAlumniInSectors > 0 ? (count / totalAlumniInSectors) * 100 : 0;
    const meta = INDUSTRY_META[name] || INDUSTRY_META.Other;

    return {
      name,
      subtext: meta.subtext,
      count,
      value: count,
      percentage: pct,
      color: meta.color,
      rank: `#${idx + 1}`,
    };
  });

  const leadingSector = chartData[0];

  return (
    <ChartCard
      title="Industry Sector Breakdown"
      subtitle="Macro sector concentration across alumni employers"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <TrendingUp className="w-3 h-3 text-emerald-600" />
          Top: {leadingSector?.name} ({leadingSector?.percentage.toFixed(0)}%)
        </span>
      }
    >
      <div className="flex flex-col justify-between h-[280px]">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center flex-1 min-h-0">
          {/* Left: Donut Chart with Centered Count */}
          <div className="sm:col-span-5 relative h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </div>
                        <div className="text-slate-500 mt-1">
                          {item.count} alumni ({item.percentage.toFixed(1)}%)
                        </div>
                        <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">
                          {item.subtext}
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={66}
                  paddingAngle={3}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                {totalAlumniInSectors}
              </span>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                Employed
              </span>
            </div>
          </div>

          {/* Right: Detailed Breakdown List */}
          <div className="sm:col-span-7 flex flex-col justify-center space-y-1 pr-1 border-l border-slate-100 pl-3 max-h-44 overflow-y-auto scrollbar-thin">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 text-xs transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                  <span className="font-bold text-slate-900">{item.count}</span>
                  <span className="text-slate-400 text-[10px]">
                    ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Insight Callout Banner */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs mt-1 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate text-[11px]">
              Leading: <strong className="text-slate-900">{leadingSector?.name}</strong>
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
            {leadingSector?.count} ({leadingSector?.percentage.toFixed(0)}%)
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
