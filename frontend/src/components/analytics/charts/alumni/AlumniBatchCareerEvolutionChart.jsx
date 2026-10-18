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
} from 'recharts';
import { History, TrendingUp } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const CATEGORY_COLORS = {
  Software: '#3B82F6',
  DevOps: '#6366F1',
  'Data Science': '#10B981',
  Product: '#F59E0B',
  Security: '#EF4444',
  Other: '#94A3B8',
};

const CATEGORY_LABEL_MAP = {
  SOFTWARE: 'Software',
  DEVOPS_CLOUD: 'DevOps',
  DATA_SCIENCE: 'Data Science',
  PRODUCT_MANAGEMENT: 'Product',
  SECURITY: 'Security',
  BUSINESS_SALES: 'Other',
};

/**
 * AlumniBatchCareerEvolutionChart Component (Visual 5 - Row 3 Col 2)
 * Stacked bar chart showing the career discipline transition of graduating batches (2016 through 2020).
 * Strictly consumes live API data from data.alumni.career_paths.cross_associations.job_categories_by_batch.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniBatchCareerEvolutionChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-56 bg-slate-100 rounded-lg my-auto" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const rawBatches = data?.alumni?.career_paths?.cross_associations?.job_categories_by_batch || [];

  if (!rawBatches || rawBatches.length === 0) {
    return (
      <ChartCard
        title="Career Evolution by Batch"
        subtitle="Discipline transitions across graduating alumni classes"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Batch Evolution Data Unavailable"
          message="Technical issue: Career evolution across batches data is not available."
        />
      </ChartCard>
    );
  }

  // Sort batches chronologically
  const sortedBatches = [...rawBatches].sort(
    (a, b) => Number(a.batch__start_year) - Number(b.batch__start_year)
  );

  const chartData = sortedBatches.map((item) => {
    const year = item.batch__start_year;
    const row = {
      batch: `Batch ${year}`,
      Software: 0,
      DevOps: 0,
      'Data Science': 0,
      Product: 0,
      Security: 0,
      Other: 0,
    };

    (item.categories || []).forEach((cat) => {
      const label = CATEGORY_LABEL_MAP[cat.job_category] || 'Other';
      row[label] = (row[label] || 0) + (Number(cat.count) || 0);
    });

    return row;
  });

  return (
    <ChartCard
      title="Career Evolution Across Batches"
      subtitle="Job role distribution across graduation cohorts (2016–2020)"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <History className="w-3 h-3 text-indigo-600" />
          {chartData.length} Cohorts
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              barSize={18}
              maxBarSize={22}
              margin={{ top: 8, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="batch"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between gap-3">
                        <span>{label}</span>
                        <span className="text-[10px] text-slate-400">Total: {total}</span>
                      </div>
                      <div className="space-y-1">
                        {payload.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}:
                            </span>
                            <span className="font-semibold text-slate-900">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
              />
              <Bar dataKey="Software" stackId="a" fill={CATEGORY_COLORS.Software} radius={[0, 0, 0, 0]} />
              <Bar dataKey="DevOps" stackId="a" fill={CATEGORY_COLORS.DevOps} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Data Science" stackId="a" fill={CATEGORY_COLORS['Data Science']} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Product" stackId="a" fill={CATEGORY_COLORS.Product} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Security" stackId="a" fill={CATEGORY_COLORS.Security} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insight */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cloud & Data Science share grew consistently across recent batches.</span>
          </div>
          <span className="text-[10px] text-slate-400">
            Stacked Specializations
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
