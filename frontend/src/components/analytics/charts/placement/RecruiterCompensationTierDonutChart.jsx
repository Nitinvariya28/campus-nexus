import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Sparkles, Award } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const TIER_CONFIG = {
  SUPER_DREAM: {
    label: 'Super Dream (>12 LPA)',
    color: '#8B5CF6',
    sublabel: 'Tier-1 Elite Product',
  },
  DREAM: {
    label: 'Dream Tier (8–12 LPA)',
    color: '#3B82F6',
    sublabel: 'Tier-2 Product & FinTech',
  },
  UNICORN: {
    label: 'Unicorn Startups',
    color: '#EC4899',
    sublabel: 'High-Growth Ventures',
  },
  REGULAR: {
    label: 'Mass / Regular Recruiters',
    color: '#10B981',
    sublabel: 'IT Services & Core',
  },
  CORE: {
    label: 'Core Engineering',
    color: '#F59E0B',
    sublabel: 'Hardware & Infrastructure',
  },
};

/**
 * RecruiterCompensationTierDonutChart Component (Visual 2 - Row 2 Col 2: 4 cols)
 * Donut chart displaying the distribution of offers across recruiter compensation tiers.
 * Strictly consumes live API data from data.placement_cell.placement_kpis.tier_outcomes
 * or data.placement_cell.recruiter_health.yearly_trends.by_tier.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function RecruiterCompensationTierDonutChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="w-36 h-36 rounded-full border-8 border-slate-100 mx-auto my-auto" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  const pcData = data?.placement_cell || {};
  const tierOutcomes = pcData.placement_kpis?.tier_outcomes || [];
  const yearlyTiers = pcData.recruiter_health?.yearly_trends?.by_tier || [];

  // Group offers by company tier
  const tierMap = {};
  if (tierOutcomes.length > 0) {
    tierOutcomes.forEach((t) => {
      const tierKey = t.company__company_tier || 'REGULAR';
      tierMap[tierKey] = (tierMap[tierKey] || 0) + (Number(t.total_offers) || 0);
    });
  } else if (yearlyTiers.length > 0) {
    yearlyTiers.forEach((t) => {
      const tierKey = t.company__company_tier || 'REGULAR';
      tierMap[tierKey] = (tierMap[tierKey] || 0) + (Number(t.total_offers) || 0);
    });
  }

  const tierKeys = Object.keys(tierMap);
  if (tierKeys.length === 0) {
    return (
      <ChartCard
        title="Compensation Tier Breakdown"
        subtitle="Distribution of offers across recruiter tiers"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Tier Data Unavailable"
          message="Technical issue: Compensation tier distribution data is not available."
        />
      </ChartCard>
    );
  }

  const totalOffers = Object.values(tierMap).reduce((a, b) => a + b, 0);

  const chartData = tierKeys.map((key, idx) => {
    const config = TIER_CONFIG[key] || {
      label: key.replace(/_/g, ' '),
      color: '#64748B',
      sublabel: 'Standard Recruiter',
    };
    const count = tierMap[key];
    const pct = totalOffers > 0 ? (count / totalOffers) * 100 : 0;

    return {
      key,
      name: config.label,
      sublabel: config.sublabel,
      value: count,
      percentage: pct,
      color: config.color,
    };
  }).sort((a, b) => b.value - a.value);

  const premierOffers = (tierMap.SUPER_DREAM || 0) + (tierMap.DREAM || 0) + (tierMap.UNICORN || 0);
  const premierPct = totalOffers > 0 ? ((premierOffers / totalOffers) * 100).toFixed(0) : '0';

  return (
    <ChartCard
      title="Recruiter Compensation Tiers"
      subtitle="Placement offer distribution by salary caliber"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <Sparkles className="w-3 h-3 text-purple-600" />
          {premierPct}% Premier CTC
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
                        {item.value} offers ({item.percentage.toFixed(1)}%)
                      </div>
                      <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">
                        {item.sublabel}
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
              {totalOffers}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">
              Offers
            </span>
          </div>
        </div>

        {/* Detailed Tier Breakdown List */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          {chartData.slice(0, 4).map((item, idx) => (
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
                  <p className="text-[10px] text-slate-400 truncate">{item.sublabel}</p>
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

        {/* Footer Insight Callout Banner */}
        <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-purple-800 min-w-0">
            <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">
              Elite Tier Dominance: <strong className="text-purple-900">{chartData[0]?.name}</strong>
            </span>
          </div>
          <span className="font-bold text-purple-700 shrink-0">
            {chartData[0]?.percentage.toFixed(0)}% Share
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
