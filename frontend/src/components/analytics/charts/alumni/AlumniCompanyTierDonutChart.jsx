import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Award, ShieldAlert, Sparkles, Building } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const TIER_CONFIG = {
  SUPER_DREAM: {
    label: 'Super Dream (>12 LPA)',
    color: '#8B5CF6',
    sublabel: 'Tier-1 Elite Recruiter',
  },
  UNICORN: {
    label: 'Unicorn Startups',
    color: '#EC4899',
    sublabel: 'High-Growth Tech',
  },
  DREAM: {
    label: 'Dream (8-12 LPA)',
    color: '#3B82F6',
    sublabel: 'Tier-2 Product Firm',
  },
  REGULAR: {
    label: 'Regular / Mass Recruiter',
    color: '#10B981',
    sublabel: 'IT Services & Core',
  },
  CORE: {
    label: 'Core Engineering',
    color: '#F59E0B',
    sublabel: 'Infrastructure & Hardware',
  },
  GOVT_PSU: {
    label: 'Govt / PSU',
    color: '#0D9488',
    sublabel: 'Public Sector',
  },
};

/**
 * AlumniCompanyTierDonutChart Component (Visual 10 - Row 6 Col 1: 5 cols)
 * Donut chart displaying the compensation and brand tiers of corporations employing alumni.
 * Strictly consumes live API data from data.alumni.career_paths.company_insights.by_tier.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniCompanyTierDonutChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[360px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-60 bg-slate-100 rounded" />
        </div>
        <div className="w-32 h-32 rounded-full border-8 border-slate-100 mx-auto my-auto" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  const rawTiers = data?.alumni?.career_paths?.company_insights?.by_tier || [];

  if (!rawTiers || rawTiers.length === 0) {
    return (
      <ChartCard
        title="Employer Corporate Tiers"
        subtitle="Distribution across compensation & company quality bands"
        heightClass="h-[360px]"
      >
        <ChartEmptyState
          title="Tier Data Unavailable"
          message="Technical issue: Employer corporate tier breakdown data is not available."
        />
      </ChartCard>
    );
  }

  const totalCompanies = rawTiers.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

  const chartData = rawTiers.map((item) => {
    const rawKey = item.current_company__company_tier || 'REGULAR';
    const cfg = TIER_CONFIG[rawKey] || {
      label: rawKey.replace(/_/g, ' '),
      color: '#64748B',
      sublabel: 'Employer Band',
    };
    const count = Number(item.count) || 0;
    const pct = totalCompanies > 0 ? (count / totalCompanies) * 100 : 0;

    return {
      rawKey,
      name: cfg.label,
      sublabel: cfg.sublabel,
      value: count,
      percentage: pct,
      color: cfg.color,
    };
  });

  const tier1Count = chartData
    .filter((d) => d.rawKey === 'SUPER_DREAM' || d.rawKey === 'UNICORN' || d.rawKey === 'DREAM')
    .reduce((sum, d) => sum + d.value, 0);
  const tier1Pct = totalCompanies > 0 ? ((tier1Count / totalCompanies) * 100).toFixed(0) : '0';

  return (
    <ChartCard
      title="Corporate Tier Breakdown"
      subtitle="Recruiter quality & compensation bands"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Award className="w-3 h-3 text-purple-600" />
          {tier1Pct}% Tier-1 & Unicorns
        </span>
      }
    >
      <div className="flex flex-col justify-between h-[300px]">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center flex-1 min-h-0">
          {/* Left: Donut Chart with Centered Total */}
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
                          {item.value} employer companies ({item.percentage.toFixed(1)}%)
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.sublabel}</div>
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
                {totalCompanies}
              </span>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                Firms
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
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.sublabel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                  <span className="font-bold text-slate-900">{item.value}</span>
                  <span className="text-slate-400 text-[10px]">
                    ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Insight */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs mt-1 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[11px]">High representation in elite hiring tiers.</span>
          </div>
          <span className="text-[10px] text-slate-400">{totalCompanies} Companies</span>
        </div>
      </div>
    </ChartCard>
  );
}
