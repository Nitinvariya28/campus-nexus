import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Building2, Briefcase, Award } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const PALETTE = [
  '#4F46E5', // Indigo
  '#4338CA',
  '#3730A3',
  '#3B82F6', // Blue
  '#2563EB',
  '#1D4ED8',
  '#0EA5E9', // Sky
  '#0284C7',
  '#0D9488', // Teal
  '#059669', // Emerald
];

/**
 * AlumniTopEmployerOrganizationsChart Component (Visual 11 - Row 6 Col 2: 7 cols)
 * Wide horizontal bar chart displaying top 10 employer organizations employing university alumni.
 * Strictly consumes live API data from data.alumni.career_paths.company_insights.by_company.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniTopEmployerOrganizationsChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[360px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const rawCompanies = data?.alumni?.career_paths?.company_insights?.by_company || [];

  if (!rawCompanies || rawCompanies.length === 0) {
    return (
      <ChartCard
        title="Top Employer Organizations"
        subtitle="Corporations with highest alumni headcount"
        heightClass="h-[360px]"
      >
        <ChartEmptyState
          title="Company Footprint Unavailable"
          message="Technical issue: Alumni employer footprint data is not available."
        />
      </ChartCard>
    );
  }

  const chartData = rawCompanies.slice(0, 10).map((item, idx) => ({
    company: item.current_company__name || `Company #${idx + 1}`,
    count: Number(item.count) || 0,
    rank: `#${idx + 1}`,
  }));

  const maxCount = chartData[0]?.count || 1;

  return (
    <ChartCard
      title="Top Employer Organizations"
      subtitle="Corporations with highest concentrations of alumni talent"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <Building2 className="w-3 h-3 text-indigo-600" />
          {rawCompanies.length} Total Employers
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 30, left: 15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                domain={[0, Math.max(maxCount + 1, 4)]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="company"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={130}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="font-bold text-indigo-600">{item.rank}</span>
                        {item.company}
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1.5 text-slate-600">
                        <span>Employed Alumni:</span>
                        <span className="font-bold text-slate-900">{item.count} graduates</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insight */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 truncate">
            <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">
              Corporate Trust: Demonstrates repeated institutional hiring across alumni batches.
            </span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">Ranked Top 10</span>
        </div>
      </div>
    </ChartCard>
  );
}
