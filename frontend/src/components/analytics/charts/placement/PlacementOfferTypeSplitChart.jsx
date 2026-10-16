import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Briefcase, Zap, CheckCircle2 } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const OFFER_TYPE_CONFIG = {
  FULL_TIME_PLACEMENT: {
    label: 'Full-Time Placement (FTE)',
    color: '#4F46E5', // Indigo
    subtext: 'Direct corporate campus recruitment',
  },
  FTE: {
    label: 'Full-Time Placement (FTE)',
    color: '#4F46E5',
    subtext: 'Direct corporate campus recruitment',
  },
  PRE_PLACEMENT_OFFER: {
    label: 'Pre-Placement Offer (PPO)',
    color: '#06B6D4', // Cyan
    subtext: 'Converted post-internship offer',
  },
  PPO: {
    label: 'Pre-Placement Offer (PPO)',
    color: '#06B6D4',
    subtext: 'Converted post-internship offer',
  },
  INTERNSHIP: {
    label: 'Pre-Final Internship',
    color: '#F59E0B', // Amber
    subtext: 'Stipend summer training track',
  },
  OTHER: {
    label: 'Off-Campus / Direct',
    color: '#64748B',
    subtext: 'External verified verification',
  },
};

/**
 * PlacementOfferTypeSplitChart Component (Visual 3 - Row 2 Col 3: 4 cols)
 * Donut chart displaying the structural breakdown between Full-Time Placement offers,
 * Pre-Placement Offers (PPO), and Pre-Final Internships.
 * Strictly consumes live API data from data.placement_cell.placement_kpis.breakdowns.by_offer_type.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function PlacementOfferTypeSplitChart({ data, loading = false }) {
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

  const rawOfferTypes =
    data?.placement_cell?.placement_kpis?.breakdowns?.by_offer_type ||
    data?.common?.placement_snapshot?.breakdowns?.by_offer_type ||
    [];

  if (!rawOfferTypes || rawOfferTypes.length === 0) {
    return (
      <ChartCard
        title="Offer Type Distribution"
        subtitle="Full-Time Placement vs PPO & Internship split"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Offer Type Data Unavailable"
          message="Technical issue: Offer type classification data is not available."
        />
      </ChartCard>
    );
  }

  const totalOffers = rawOfferTypes.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

  const chartData = rawOfferTypes.map((item) => {
    const rawKey = item.offer_type || 'FTE';
    const config = OFFER_TYPE_CONFIG[rawKey] || OFFER_TYPE_CONFIG.OTHER;
    const count = Number(item.count) || 0;
    const pct = totalOffers > 0 ? (count / totalOffers) * 100 : 0;

    return {
      name: config.label,
      subtext: config.subtext,
      value: count,
      percentage: pct,
      color: config.color,
    };
  }).sort((a, b) => b.value - a.value);

  const primaryOffer = chartData[0];

  return (
    <ChartCard
      title="Offer Type Split"
      subtitle="Structural breakdown of issued placement offers"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Briefcase className="w-3 h-3 text-indigo-600" />
          {primaryOffer?.percentage.toFixed(0)}% FTE Direct
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
                        {item.value} verified offers ({item.percentage.toFixed(1)}%)
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
              Total Offers
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
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{item.subtext}</p>
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
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Recruitment Conversion: Robust full-time placement dominance.
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium shrink-0">
            {chartData.length} Offer Categories
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
