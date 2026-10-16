import React, { useState } from 'react';
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
import { Award, Briefcase, Zap } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const TIER_META = {
  SUPER_DREAM: { label: 'Super Dream (>12 LPA)', color: '#8B5CF6' },
  UNICORN: { label: 'Unicorn Startups', color: '#EC4899' },
  DREAM: { label: 'Dream (8-12 LPA)', color: '#3B82F6' },
  REGULAR: { label: 'Mass / Regular', color: '#10B981' },
};

const CATEGORY_NAMES = {
  SOFTWARE: 'Software',
  DEVOPS_CLOUD: 'DevOps & Cloud',
  DATA_SCIENCE: 'Data Science',
  PRODUCT_MANAGEMENT: 'Product Mgmt',
  SECURITY: 'Security',
  BUSINESS_SALES: 'Business',
};

/**
 * AlumniExperienceTierMatrixChart Component (Visual 4 - Row 3 Col 1)
 * Analyzes average years of industry experience across corporate recruiter tiers and job roles.
 * Strictly consumes live API data from data.alumni.career_paths.cross_associations.experience_by_tier_and_job_category.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniExperienceTierMatrixChart({ data, loading = false }) {
  const [activeTier, setActiveTier] = useState('SUPER_DREAM');

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const tierList = data?.alumni?.career_paths?.cross_associations?.experience_by_tier_and_job_category || [];

  if (!tierList || tierList.length === 0) {
    return (
      <ChartCard
        title="Experience by Corporate Tier"
        subtitle="Average industry experience across tiers and role categories"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Experience Matrix Unavailable"
          message="Technical issue: Experience by corporate tier data is not available."
        />
      </ChartCard>
    );
  }

  // Find active tier object or fallback to first available
  const tierObj = tierList.find((t) => t.company__tier === activeTier) || tierList[0] || {};
  const currentCategories = tierObj.categories || [];

  const chartData = currentCategories.map((item) => {
    const rawKey = item.job_category || 'SOFTWARE';
    const label = CATEGORY_NAMES[rawKey] || rawKey.replace(/_/g, ' ');
    const exp = Number(Number(item.average_experience).toFixed(1)) || 0;

    return {
      rawKey,
      name: label,
      exp,
    };
  });

  const tierConfig = TIER_META[activeTier] || { label: activeTier, color: '#4F46E5' };

  return (
    <ChartCard
      title="Experience Threshold by Company Tier"
      subtitle="Average industry tenure required by corporate tier and role"
      heightClass="h-auto"
      actionSlot={
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
          {tierList.map((t) => {
            const key = t.company__tier;
            const meta = TIER_META[key] || { label: key };
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTier(key)}
                className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
                  activeTier === key
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {meta.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 35, left: 15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                domain={[0, 6]}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
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
                width={95}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="flex items-center justify-between gap-4 mt-1.5 text-slate-600">
                        <span>Corporate Tier:</span>
                        <span className="font-bold text-indigo-700">{tierConfig.label}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1 text-slate-600">
                        <span>Average Experience:</span>
                        <span className="font-bold text-slate-900">{item.exp} Years</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="exp" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={tierConfig.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Actionable Callout Banner */}
        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-indigo-800 min-w-0">
            <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">
              Selected Tier: <strong>{tierConfig.label}</strong>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 shrink-0">
            Peak: {chartData[0]?.name} ({chartData[0]?.exp} yrs)
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
