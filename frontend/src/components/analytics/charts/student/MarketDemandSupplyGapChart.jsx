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
import { ArrowLeftRight, TrendingDown, TrendingUp } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

/**
 * MarketDemandSupplyGapChart Component (Visual 4 - Student Dashboard Row 3 Col 1)
 * Paired bar chart contrasting corporate recruitment skill demand % against student declared supply %.
 * Highlights critical institutional market deficits and talent surpluses.
 * Strictly consumes live API data from data.student.market_skill_gaps.supply_vs_demand_global.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function MarketDemandSupplyGapChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const marketGaps = data?.student?.market_skill_gaps?.supply_vs_demand_global || {};
  const rawSkills = marketGaps.skills || [];
  const denominators = marketGaps.denominators || {};

  if (!rawSkills || rawSkills.length === 0) {
    return (
      <ChartCard
        title="Market Demand vs Supply Gap"
        subtitle="Corporate recruitment requirements compared with student supply"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Market Gap Data Unavailable"
          message="Technical issue: Market demand vs supply gap data is not available."
        />
      </ChartCard>
    );
  }

  // Select top 7 high-impact skills with active demand or notable gap
  const chartData = rawSkills.slice(0, 7).map((item) => {
    const demandPct = Number(item.market_demand_pct) || 0;
    const supplyPct = Number(item.student_supply_pct) || 0;
    const gapPct = Number(item.market_gap_pct) || 0;

    return {
      skill: item.skill__name,
      marketDemand: parseFloat(demandPct.toFixed(1)),
      studentSupply: parseFloat(supplyPct.toFixed(1)),
      gap: parseFloat(gapPct.toFixed(1)),
      isShortage: gapPct < 0,
    };
  });

  const biggestShortage = chartData.find((d) => d.isShortage) || chartData[0];

  return (
    <ChartCard
      title="Market Demand vs Supply Gap"
      subtitle="Corporate hiring requirements vs student skill supply"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <ArrowLeftRight className="w-3 h-3 text-purple-600" />
          {denominators.total_opportunities != null ? `${denominators.total_opportunities} Drives Analyzed` : 'Market Intelligence'}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 25, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                unit="%"
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="skill"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800">{item.skill}</div>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between gap-4 text-purple-700 font-medium">
                          <span>Recruiter Demand:</span>
                          <span>{item.marketDemand}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-emerald-700 font-medium">
                          <span>Student Supply:</span>
                          <span>{item.studentSupply}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 font-semibold">
                          <span>Net Gap:</span>
                          <span className={item.isShortage ? 'text-rose-600' : 'text-emerald-600'}>
                            {item.gap > 0 ? `+${item.gap}%` : `${item.gap}%`}{' '}
                            {item.isShortage ? '(Shortage)' : '(Surplus)'}
                          </span>
                        </div>
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
              <Bar
                dataKey="marketDemand"
                name="Recruiter Demand %"
                fill="#8B5CF6"
                radius={[0, 4, 4, 0]}
                barSize={9}
              />
              <Bar
                dataKey="studentSupply"
                name="Student Supply %"
                fill="#10B981"
                radius={[0, 4, 4, 0]}
                barSize={9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Shortage Alert Badge */}
        <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-purple-800">
            {biggestShortage?.isShortage ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="font-medium">Primary Deficit:</span>
            <span className="font-bold">{biggestShortage?.skill}</span>
          </div>
          <span className="text-[11px] font-semibold text-rose-600">
            {biggestShortage?.gap}% Shortage
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
