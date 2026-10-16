import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Globe2, MapPin } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const HUB_COLORS = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
];

/**
 * AlumniGeographicFootprintChart Component (Visual 1 - Row 2 Col 1)
 * Displays the geographic distribution of alumni across Indian tech corridors and international hubs.
 * Strictly consumes live API data from data.alumni.career_paths.employment_demographics.by_location.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniGeographicFootprintChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-60 bg-slate-100 rounded" />
        </div>
        <div className="w-36 h-36 rounded-full border-8 border-slate-100 mx-auto my-auto" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  const rawLocations = data?.alumni?.career_paths?.employment_demographics?.by_location || [];
  const totalAlumni = data?.alumni?.career_paths?.alumni_overview?.total_alumni_profiles || 0;

  if (!rawLocations || rawLocations.length === 0 || totalAlumni === 0) {
    return (
      <ChartCard
        title="Global Geographic Footprint"
        subtitle="Alumni distribution across domestic & international hubs"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Geographic Data Unavailable"
          message="Technical issue: Alumni geographic footprint data is not available."
        />
      </ChartCard>
    );
  }

  const totalEvaluated = rawLocations.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

  const chartData = rawLocations.slice(0, 6).map((item, idx) => {
    const count = Number(item.count) || 0;
    const pct = totalEvaluated > 0 ? (count / totalEvaluated) * 100 : 0;
    const parts = item.location.split(',');
    const city = parts[0]?.trim() || item.location;
    const region = parts.slice(1).join(',')?.trim() || '';
    const isGlobal = /UK|USA|London|Jose|York|Canada|Europe/i.test(item.location);

    return {
      fullName: item.location,
      name: city,
      region,
      value: count,
      percentage: pct,
      color: HUB_COLORS[idx % HUB_COLORS.length],
      isGlobal,
    };
  });

  const overseasCount = chartData
    .filter((d) => d.isGlobal)
    .reduce((sum, d) => sum + d.value, 0);
  const overseasPct = totalEvaluated > 0 ? ((overseasCount / totalEvaluated) * 100).toFixed(1) : '0.0';

  return (
    <ChartCard
      title="Global Geographic Footprint"
      subtitle="Alumni career migration across tech hubs"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Globe2 className="w-3 h-3 text-indigo-600" />
          {overseasPct}% Overseas
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Donut Chart with Centered Count */}
        <div className="relative h-44 w-full flex items-center justify-center">
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
                        {item.fullName}
                      </div>
                      <div className="text-slate-500 mt-1">
                        {item.value} alumni ({item.percentage.toFixed(1)}%)
                      </div>
                      <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">
                        {item.isGlobal ? 'International Hub' : 'Domestic Tech Corridor'}
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
                innerRadius={50}
                outerRadius={70}
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
            <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              {totalEvaluated}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
              Graduates
            </span>
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {chartData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1">
                    {item.name}
                    {item.isGlobal && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Global
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{item.region}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-slate-900">{item.value}</span>
                <span className="text-[11px] font-medium text-slate-500">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Actionable Callout Banner */}
        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
          <span className="text-indigo-800 font-medium">Top Domestic Hub:</span>
          <span className="font-bold text-indigo-700">
            {chartData[0]?.fullName} ({chartData[0]?.value} alumni)
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
