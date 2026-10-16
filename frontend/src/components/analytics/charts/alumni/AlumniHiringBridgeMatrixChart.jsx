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
import { Users, Briefcase, Network, ExternalLink, Sparkles } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

/**
 * AlumniHiringBridgeMatrixChart Component (Visual 6 - Row 4 Full Width 12 Cols)
 * Hero Executive Matrix connecting corporate recruiters with active open campus drives
 * to verified alumni currently working inside those hiring corporations.
 * Strictly consumes live API data from data.alumni.alumni_contributions.alumni_hiring_bridge.alumni_at_hiring_companies.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniHiringBridgeMatrixChart({ data, loading = false }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'high_density'

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-60 bg-slate-200 rounded" />
          <div className="h-3 w-80 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    );
  }

  const rawBridge =
    data?.alumni?.alumni_contributions?.alumni_hiring_bridge?.alumni_at_hiring_companies || [];

  if (!rawBridge || rawBridge.length === 0) {
    return (
      <ChartCard
        title="Alumni Campus Hiring Bridge Executive Matrix"
        subtitle="Open corporate drives cross-referenced with alumni currently employed inside hiring firms"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Hiring Bridge Data Unavailable"
          message="Technical issue: Corporate hiring bridge cross-reference data is not available."
        />
      </ChartCard>
    );
  }

  const filteredBridge =
    filterMode === 'high_density'
      ? rawBridge.filter((item) => Number(item.alumni_working_there) >= 3)
      : rawBridge;

  const chartData = filteredBridge.slice(0, 10).map((item) => ({
    company: item.company__name,
    openDrives: Number(item.open_opportunities_count) || 0,
    alumniInside: Number(item.alumni_working_there) || 0,
  }));

  const totalAlumniInsideFirms = rawBridge.reduce(
    (acc, curr) => acc + (Number(curr.alumni_working_there) || 0),
    0
  );
  const totalOpenDrivesWithAlumni = rawBridge.reduce(
    (acc, curr) => acc + (Number(curr.open_opportunities_count) || 0),
    0
  );

  return (
    <ChartCard
      title="Alumni Campus Hiring Bridge Executive Matrix"
      subtitle="Corporate recruiters with active job drives cross-referenced with alumni currently working inside them"
      heightClass="h-auto"
      actionSlot={
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Hiring Firms ({rawBridge.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('high_density')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                filterMode === 'high_density'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High Alumni Density (≥3)
            </button>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Network className="w-3 h-3 text-emerald-600" />
            {totalAlumniInsideFirms} Referral Bridges
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Paired Bar Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 35, left: 20, bottom: 0 }}
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
                dataKey="company"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-900 mb-1.5">{item.company}</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4 text-purple-700 font-medium">
                          <span>Open Campus Drives:</span>
                          <span className="font-bold">{item.openDrives} opportunities</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-emerald-700 font-medium">
                          <span>Verified Alumni Working Inside:</span>
                          <span className="font-bold">{item.alumniInside} alumni</span>
                        </div>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Prime target for direct alumni referrals and pre-interview briefings.</span>
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
                name="Active Campus Drives"
                dataKey="openDrives"
                fill="#8B5CF6"
                radius={[0, 3, 3, 0]}
                barSize={12}
              />
              <Bar
                name="Alumni Working Inside"
                dataKey="alumniInside"
                fill="#10B981"
                radius={[0, 3, 3, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Executive Referral Highway Callout Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-emerald-50/80 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white shadow-2xs border border-purple-200 flex items-center justify-center shrink-0">
              <Network className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                Institutional Referral Pipeline: {totalOpenDrivesWithAlumni} Active Drives with Internal Alumni Backing
              </p>
              <p className="text-[11px] text-slate-500">
                Students can leverage warm referrals and interview preparation debriefs through alumni working inside these hiring companies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
              {totalAlumniInsideFirms} Alumni Connections
            </span>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
