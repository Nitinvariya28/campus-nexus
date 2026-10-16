import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Award, Building2, TrendingUp, DollarSign } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const DONUT_COLORS = [
  '#10B981', // Emerald (#1)
  '#06B6D4', // Cyan (#2)
  '#6366F1', // Indigo (#3)
  '#3B82F6', // Blue (#4)
  '#F59E0B', // Amber (#5)
  '#8B5CF6', // Purple (#6)
];

const TIER_COLORS = {
  'Super Dream': 'bg-amber-100 text-amber-800 border-amber-200',
  'Dream': 'bg-purple-100 text-purple-800 border-purple-200',
  'Regular': 'bg-blue-100 text-blue-800 border-blue-200',
  'Mass Recruiters': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

/**
 * TopHiringOrganizationsDonutChart Component (Visual 10 - Row 6 Col 1: 5 cols)
 * Identifies top corporate recruiting partners absorbing the highest volume of campus talent.
 * Strictly consumes live API data from data.placement_cell.recruiter_health.company_outcomes.
 *
 * @param {object} data - Aggregated dashboard analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function TopHiringOrganizationsDonutChart({ data, loading = false }) {
  const [metricMode, setMetricMode] = useState('total_offers'); // 'total_offers' or 'distinct_students'
  const [activeIndex, setActiveIndex] = useState(null);

  // Extract raw company outcomes
  const rawCompanies = useMemo(() => {
    return data?.placement_cell?.recruiter_health?.company_outcomes || [];
  }, [data]);

  // Aggregate and sort top employers
  const processedData = useMemo(() => {
    if (!rawCompanies || rawCompanies.length === 0) return null;

    // Aggregate by company__name
    const compMap = {};
    rawCompanies.forEach((item) => {
      const name = item.company__name || 'Unknown Partner';
      const tier = item.company__company_tier || 'Regular';
      const offers = Number(item.total_offers) || 0;
      const students = Number(item.distinct_students) || 0;
      const lpa = Number(item.average_lpa) || 0;

      if (!compMap[name]) {
        compMap[name] = {
          name,
          tier,
          total_offers: 0,
          distinct_students: 0,
          lpaSum: 0,
          count: 0,
        };
      }
      compMap[name].total_offers += offers;
      compMap[name].distinct_students += students;
      if (lpa > 0) {
        compMap[name].lpaSum += lpa;
        compMap[name].count += 1;
      }
    });

    const list = Object.values(compMap).map((c) => ({
      name: c.name,
      tier: c.tier,
      total_offers: c.total_offers,
      distinct_students: c.distinct_students,
      avg_lpa: c.count > 0 ? Number((c.lpaSum / c.count).toFixed(2)) : 0,
    }));

    // Sort by selected metric
    list.sort((a, b) => b[metricMode] - a[metricMode]);

    const topFive = list.slice(0, 5);
    const others = list.slice(5);

    const totalMetricSum = list.reduce((acc, curr) => acc + curr[metricMode], 0);
    const topMetricSum = topFive.reduce((acc, curr) => acc + curr[metricMode], 0);

    const donutSlices = topFive.map((c, i) => ({
      name: c.name,
      value: c[metricMode],
      tier: c.tier,
      avg_lpa: c.avg_lpa,
      percentage:
        totalMetricSum > 0
          ? Number(((c[metricMode] / totalMetricSum) * 100).toFixed(1))
          : 0,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }));

    if (others.length > 0) {
      const otherValue = others.reduce((acc, curr) => acc + curr[metricMode], 0);
      donutSlices.push({
        name: 'Other Recruiters',
        value: otherValue,
        tier: 'General',
        avg_lpa: 0,
        percentage:
          totalMetricSum > 0
            ? Number(((otherValue / totalMetricSum) * 100).toFixed(1))
            : 0,
        color: '#94A3B8', // Slate-400
      });
    }

    return {
      topFive,
      donutSlices,
      totalMetricSum,
      topMetricSum,
      concentrationPct:
        totalMetricSum > 0
          ? Number(((topMetricSum / totalMetricSum) * 100).toFixed(1))
          : 0,
    };
  }, [rawCompanies, metricMode]);

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="flex items-center justify-center my-auto">
          <div className="w-36 h-36 rounded-full border-8 border-slate-200" />
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    );
  }

  if (
    !processedData ||
    !processedData.donutSlices ||
    processedData.donutSlices.length === 0 ||
    processedData.totalMetricSum === 0
  ) {
    return (
      <ChartEmptyState
        title="Top Recruiting Employers by Headcount"
        message="Technical issue: Corporate employer outcome metrics are not available."
      />
    );
  }

  return (
    <ChartCard
      title="Top Recruiting Employers by Headcount"
      subtitle="Corporate absorption share and compensation delivered by volume hirers"
      badge={
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
          <Award className="w-3 h-3 text-emerald-600" />
          <span>Top 5 Absorb {processedData.concentrationPct}%</span>
        </div>
      }
      action={
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
          <button
            onClick={() => setMetricMode('total_offers')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              metricMode === 'total_offers'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Total Offers
          </button>
          <button
            onClick={() => setMetricMode('distinct_students')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              metricMode === 'distinct_students'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Distinct Hires
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-[320px] justify-between">
        {/* Split view: Left Donut + Right Top 5 Leaderboard */}
        <div className="grid grid-cols-12 gap-4 flex-1 items-center">
          {/* Donut representation */}
          <div className="col-span-5 relative flex items-center justify-center h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.donutSlices}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {processedData.donutSlices.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={activeIndex === index ? '#0F172A' : '#FFFFFF'}
                      strokeWidth={activeIndex === index ? 2 : 1}
                      className="cursor-pointer transition-all"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg border border-slate-700">
                          <p className="font-semibold text-slate-200">{item.name}</p>
                          <p className="text-emerald-400 font-medium mt-1">
                            {metricMode === 'total_offers' ? 'Offers' : 'Hires'}:{' '}
                            <span className="font-bold">{item.value}</span>
                          </p>
                          <p className="text-slate-300">
                            Share: <span className="font-bold text-white">{item.percentage}%</span>
                          </p>
                          {item.avg_lpa > 0 && (
                            <p className="text-amber-300 font-medium">
                              Avg Package: ₹{item.avg_lpa} LPA
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-slate-900 leading-none">
                {processedData.totalMetricSum}
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">
                {metricMode === 'total_offers' ? 'Offers' : 'Hires'}
              </span>
            </div>
          </div>

          {/* Right Top 5 Leaderboard */}
          <div className="col-span-7 space-y-1.5 overflow-y-auto max-h-[220px] pr-1">
            {processedData.topFive.map((comp, idx) => {
              const tierBadgeClass =
                TIER_COLORS[comp.tier] ||
                'bg-slate-100 text-slate-700 border-slate-200';
              const color = DONUT_COLORS[idx % DONUT_COLORS.length];

              return (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      style={{ backgroundColor: color }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate max-w-[130px]">
                          {comp.name}
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${tierBadgeClass}`}
                        >
                          {comp.tier}
                        </span>
                      </div>
                      {comp.avg_lpa > 0 && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <DollarSign className="w-2.5 h-2.5 text-emerald-600" />
                          <span>₹{comp.avg_lpa} LPA avg</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900">
                      {comp[metricMode]}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {metricMode === 'total_offers' ? 'offers' : 'hires'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Verification Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Top recruiter absorption audit across campus cycles</span>
          </div>
          <span className="font-semibold text-slate-700">
            {processedData.topFive.length} Primary Employers
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
