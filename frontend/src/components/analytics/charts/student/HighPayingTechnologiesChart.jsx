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
import { IndianRupee, TrendingUp } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

/**
 * HighPayingTechnologiesChart Component (Visual 10 - Student Dashboard Row 5 Col 1)
 * Horizontal grouped bar chart revealing the verified average and peak compensation (CTC in LPA)
 * associated with specialized technical competencies across campus placement offers.
 * Strictly consumes live API data from data.student.market_skill_gaps.package_associations.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function HighPayingTechnologiesChart({ data, loading = false }) {
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

  const rawAssociations =
    data?.student?.market_skill_gaps?.package_associations || [];

  if (!rawAssociations || rawAssociations.length === 0) {
    return (
      <ChartCard
        title="High-Paying Technical Specializations"
        subtitle="Average vs Peak CTC compensation by technology"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Package Association Data Unavailable"
          message="Technical issue: Technology package association data is not available."
        />
      </ChartCard>
    );
  }

  // Pick top 7 highest paying technologies
  const chartData = rawAssociations.slice(0, 7).map((item) => ({
    skill: item.skill__name,
    avgPackage: Number(Number(item.average_package_lpa).toFixed(1)) || 0,
    maxPackage: Number(Number(item.max_package_lpa).toFixed(1)) || 0,
    sampleSize: item.sample_size,
  }));

  const topSkill = chartData[0];

  return (
    <ChartCard
      title="High-Paying Tech Specializations"
      subtitle="Average vs Peak CTC compensation (₹ LPA) by technology"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <IndianRupee className="w-3 h-3 text-amber-600" />
          Peak: {topSkill?.skill} (₹{topSkill?.maxPackage} LPA)
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 30, left: 15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                domain={[0, 'auto']}
                unit="L"
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
                        <div className="flex items-center justify-between gap-4 text-amber-700">
                          <span>Average CTC:</span>
                          <span className="font-bold">₹ {item.avgPackage} LPA</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-indigo-700">
                          <span>Peak Recorded CTC:</span>
                          <span className="font-bold">₹ {item.maxPackage} LPA</span>
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          Based on {item.sampleSize} verified candidate records
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
                dataKey="avgPackage"
                name="Average LPA"
                fill="#F59E0B"
                radius={[0, 4, 4, 0]}
                barSize={9}
              />
              <Bar
                dataKey="maxPackage"
                name="Peak LPA"
                fill="#4F46E5"
                radius={[0, 4, 4, 0]}
                barSize={9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Highest Paying Insight Callout */}
        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-800">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium">Top Compensation Specialization:</span>
            <span className="font-bold">{topSkill?.skill}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700">
            Avg ₹{topSkill?.avgPackage} LPA
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
