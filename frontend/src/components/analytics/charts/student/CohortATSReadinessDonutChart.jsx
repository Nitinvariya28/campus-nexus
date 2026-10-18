import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartTooltip from '../ChartTooltip';
import ChartEmptyState from '../ChartEmptyState';

const BAND_CONFIG = {
  'Excellent (80-100)': {
    color: '#10B981',
    label: 'Excellent (80 - 100)',
    sublabel: 'Day-1 Corporate Ready',
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  'Good (60-79)': {
    color: '#F59E0B',
    label: 'Good (60 - 79)',
    sublabel: 'Moderate Screening Match',
    icon: AlertTriangle,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'Needs Work (<60)': {
    color: '#EF4444',
    label: 'Needs Work (< 60)',
    sublabel: 'Requires Revision & Keywords',
    icon: XCircle,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

/**
 * CohortATSReadinessDonutChart Component (Visual 1 - Student Dashboard Row 2 Col 1)
 * Displays cohort-wide ATS score band distribution as a Donut Chart with centered count
 * and an exhaustive breakdown table.
 * Strictly consumes live API data from data.student.resume_cohort_health.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function CohortATSReadinessDonutChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[280px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-60 bg-slate-100 rounded" />
        </div>
        <div className="w-28 h-28 rounded-full border-8 border-slate-100 mx-auto my-auto" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-4/5" />
        </div>
      </div>
    );
  }

  const cohortHealth = data?.student?.resume_cohort_health || {};
  const rawBands = cohortHealth.ats_band_distribution || [];
  const summary = cohortHealth.cohort_ats_summary || {};

  const totalAnalyzed = Number(summary.total_resumes_analyzed ?? 0);

  if (!rawBands || rawBands.length === 0 || totalAnalyzed === 0) {
    return (
      <ChartCard
        title="Cohort ATS Screening Health"
        subtitle="Distribution across standardized corporate screening bands"
        heightClass="h-[280px]"
      >
        <ChartEmptyState
          title="ATS Distribution Unavailable"
          message="Technical issue: Cohort ATS screening distribution data is not available."
        />
      </ChartCard>
    );
  }

  const chartData = rawBands.map((item) => {
    const config = BAND_CONFIG[item.band] || {
      color: '#64748B',
      label: item.band,
      sublabel: 'Cohort Group',
      icon: ShieldCheck,
      badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
    };

    return {
      name: config.label,
      rawBand: item.band,
      value: Number(item.student_count) || 0,
      percentage: Number(item.percentage) || 0,
      color: config.color,
      sublabel: config.sublabel,
      Icon: config.icon,
      badgeBg: config.badgeBg,
    };
  });

  const excellentTier = chartData.find((d) => d.rawBand.includes('Excellent'));
  const excellentPct = excellentTier ? excellentTier.percentage.toFixed(1) : '0.0';

  return (
    <ChartCard
      title="Cohort ATS Screening Health"
      subtitle="Distribution across standardized corporate screening bands"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <ShieldCheck className="w-3 h-3 text-indigo-600" />
          {totalAnalyzed} Resumes
        </span>
      }
    >
      <div className="flex flex-col justify-between h-[280px]">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center flex-1 min-h-0">
          {/* Left: Donut Chart with Centered Metric */}
          <div className="sm:col-span-5 relative h-44 min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                          {item.value} students ({item.percentage.toFixed(1)}%)
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
                {totalAnalyzed}
              </span>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                Evaluated
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
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{item.sublabel}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                  <span className="font-bold text-slate-900">
                    {item.value}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Cohort Callout Banner */}
        <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs mt-1 shrink-0">
          <span className="text-emerald-800 font-medium text-[11px]">
            Immediate Corporate Ready:
          </span>
          <span className="font-bold text-emerald-700 text-[11px]">
            {excellentPct}% of cohort
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
