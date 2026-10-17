import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Building2, Sparkles, Briefcase, Award } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const TIER_COLORS = {
  SUPER_DREAM: '#8B5CF6',
  UNICORN: '#EC4899',
  DREAM: '#3B82F6',
  REGULAR: '#10B981',
};

/**
 * RecruiterAbsorptionHeroMatrixChart Component (Visual 6 - Row 4 Full Width: 12 cols)
 * Executive Hero Matrix cross-referencing corporate recruiting partners,
 * volume of students hired, recruiter compensation tiers, and average CTC extended.
 * Strictly consumes live API data from data.placement_cell.recruiter_health.company_outcomes.
 *
 * Designed with generous vertical & horizontal breathing room (460px height, full-width)
 * to ensure high-density recruitment matrix data is crisp, legible, and uncluttered.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function RecruiterAbsorptionHeroMatrixChart({ data, loading = false }) {
  const [selectedTier, setSelectedTier] = useState('ALL');

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[480px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-72 bg-slate-200 rounded" />
          <div className="h-3 w-96 bg-slate-100 rounded" />
        </div>
        <div className="space-y-4 my-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-3.5 w-36 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-4 bg-slate-100 rounded w-1/3" />
      </div>
    );
  }

  const rawOutcomes =
    data?.placement_cell?.recruiter_health?.company_outcomes ||
    data?.common?.placement_snapshot?.company_outcomes ||
    [];

  if (!rawOutcomes || rawOutcomes.length === 0) {
    return (
      <ChartCard
        title="Corporate Recruiter Absorption Matrix"
        subtitle="Recruiter hiring volume & average compensation packages"
        heightClass="h-[460px]"
      >
        <ChartEmptyState
          title="Recruiter Matrix Unavailable"
          message="Corporate recruiter outcomes data is currently not available for the selected filters."
        />
      </ChartCard>
    );
  }

  // Deduplicate and aggregate by company
  const companyMap = {};
  rawOutcomes.forEach((item) => {
    const name = item.company__name || 'Corporate Partner';
    const tier = item.company__company_tier || 'REGULAR';
    const students = Number(item.distinct_students) || Number(item.total_offers) || 0;
    const lpa = Number(item.average_lpa) || 0;

    if (!companyMap[name]) {
      companyMap[name] = {
        name,
        tier,
        students,
        avgLpa: lpa,
        count: 1,
      };
    } else {
      companyMap[name].students += students;
      companyMap[name].avgLpa = Math.max(companyMap[name].avgLpa, lpa);
      companyMap[name].count += 1;
    }
  });

  const allCompanies = Object.values(companyMap);

  // Filter by selected tier
  const filteredCompanies = allCompanies.filter((c) => {
    if (selectedTier === 'ALL') return true;
    return c.tier === selectedTier;
  });

  const chartData = filteredCompanies
    .sort((a, b) => b.students - a.students)
    .slice(0, 10)
    .map((c) => ({
      name: c.name,
      tier: c.tier,
      tierColor: TIER_COLORS[c.tier] || '#64748B',
      students: c.students,
      avgLpa: Number(c.avgLpa.toFixed(1)),
    }));

  const topRecruiter = chartData[0];
  const totalHiredInView = chartData.reduce((sum, item) => sum + item.students, 0);

  return (
    <ChartCard
      title="Corporate Recruiter Hiring Footprint & Talent Absorption Matrix"
      subtitle="Cross-analyzing corporate recruiters, campus hires, company tier, and average compensation"
      heightClass="h-auto"
      actionSlot={
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          {[
            { id: 'ALL', label: 'All Tiers' },
            { id: 'SUPER_DREAM', label: 'Super Dream (>12L)' },
            { id: 'UNICORN', label: 'Unicorns' },
            { id: 'DREAM', label: 'Dream (8-12L)' },
            { id: 'REGULAR', label: 'Regular' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTier(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                selectedTier === tab.id
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Paired Bar Chart with generous 460px height & breathing room */}
        <div className="h-[460px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              barGap={4}
              margin={{ top: 12, right: 35, left: 10, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={170}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-lg rounded-xl p-3 text-xs min-w-52">
                      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span
                          className="text-[9px] px-2 py-0.5 rounded-full text-white font-bold"
                          style={{ backgroundColor: item.tierColor }}
                        >
                          {item.tier.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4 text-slate-600">
                          <span>Students Placed:</span>
                          <strong className="text-indigo-600 font-bold">{item.students} candidates</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-600">
                          <span>Average CTC:</span>
                          <strong className="text-emerald-600 font-bold">₹ {item.avgLpa} LPA</strong>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={10}
                wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
              />
              <Bar dataKey="students" name="Students Hired" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="avgLpa" name="Average Package (₹ LPA)" fill="#10B981" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insight Callout Banner */}
        <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-indigo-800 min-w-0">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate">
              Lead Corporate Partner: <strong className="text-indigo-950 font-bold">{topRecruiter?.name}</strong> ({topRecruiter?.students} hires at ₹ {topRecruiter?.avgLpa} LPA).
            </span>
          </div>
          <span className="font-bold text-indigo-700 shrink-0 bg-white/70 px-2.5 py-1 rounded-lg border border-indigo-200/50">
            {totalHiredInView} Total Hires in View
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
