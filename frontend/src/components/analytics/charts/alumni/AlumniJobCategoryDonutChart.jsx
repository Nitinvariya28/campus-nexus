import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Code2, Server, Database, Layers, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const CATEGORY_CONFIG = {
  SOFTWARE: {
    label: 'Software & Engineering',
    color: '#3B82F6',
    icon: Code2,
  },
  DEVOPS_CLOUD: {
    label: 'DevOps & Cloud',
    color: '#6366F1',
    icon: Server,
  },
  DATA_SCIENCE: {
    label: 'Data Science & AI',
    color: '#10B981',
    icon: Database,
  },
  PRODUCT_MANAGEMENT: {
    label: 'Product Management',
    color: '#F59E0B',
    icon: Layers,
  },
  SECURITY: {
    label: 'Cyber Security',
    color: '#EF4444',
    icon: ShieldCheck,
  },
  BUSINESS_SALES: {
    label: 'Business & Strategy',
    color: '#8B5CF6',
    icon: TrendingUp,
  },
  DESIGN: {
    label: 'Design & UI/UX',
    color: '#EC4899',
    icon: Sparkles,
  },
};

/**
 * AlumniJobCategoryDonutChart Component (Visual 3 - Row 2 Col 3)
 * Donut chart displaying alumni career role specializations across 6 key disciplines.
 * Strictly consumes live API data from data.alumni.career_paths.employment_demographics.by_job_category.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniJobCategoryDonutChart({ data, loading = false }) {
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

  const rawCategories = data?.alumni?.career_paths?.employment_demographics?.by_job_category || [];

  if (!rawCategories || rawCategories.length === 0) {
    return (
      <ChartCard
        title="Career Specialization Bands"
        subtitle="Alumni role distribution across technical disciplines"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Role Data Unavailable"
          message="Technical issue: Alumni job category distribution data is not available."
        />
      </ChartCard>
    );
  }

  const totalGraduates = rawCategories.reduce(
    (acc, curr) => acc + (Number(curr.count) || 0),
    0
  );

  const chartData = rawCategories.map((item) => {
    const rawKey = item.job_category || 'SOFTWARE';
    const cfg = CATEGORY_CONFIG[rawKey] || {
      label: rawKey.replace(/_/g, ' '),
      color: '#64748B',
      icon: Code2,
    };
    const count = Number(item.count) || 0;
    const pct = totalGraduates > 0 ? (count / totalGraduates) * 100 : 0;

    return {
      rawKey,
      name: cfg.label,
      value: count,
      percentage: pct,
      color: cfg.color,
      Icon: cfg.icon,
    };
  });

  const topCategory = chartData[0];

  return (
    <ChartCard
      title="Career Specializations"
      subtitle="Role disciplines across alumni workforce"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Code2 className="w-3 h-3 text-blue-600" />
          Top: {topCategory?.name.split('&')[0]} ({topCategory?.value})
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Donut Chart with Centered Total */}
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
                        {item.name}
                      </div>
                      <div className="text-slate-500 mt-1">
                        {item.value} alumni ({item.percentage.toFixed(1)}%)
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
              {totalGraduates}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
              Roles
            </span>
          </div>
        </div>

        {/* Detailed Breakdown List */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {chartData.slice(0, 5).map((item, idx) => {
            const Icon = item.Icon;
            return (
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
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {item.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-slate-900">{item.value}</span>
                  <span className="text-[11px] font-medium text-slate-500">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actionable Insight Callout */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Core Tech Dominance:</span>
          <span className="font-bold text-slate-900">
            {((((chartData[0]?.value || 0) + (chartData[1]?.value || 0)) / totalGraduates) * 100).toFixed(0)}% in Dev & Cloud
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
