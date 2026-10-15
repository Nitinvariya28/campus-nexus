import React from 'react';
import ChartCard from './ChartCard';
import DistributionDonutChart from './DistributionDonutChart';

/**
 * PopulationCensusChart Component (Visual 1)
 * Renders the Platform Population Census Donut Chart.
 * Backed by data.common.platform_overview.role_breakdown
 *
 * @param {object} data - Analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function PopulationCensusChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-80 animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="w-40 h-40 rounded-full border-8 border-slate-100 mx-auto my-auto" />
        <div className="flex justify-center gap-6 pt-2">
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  const roleBreakdown = data?.common?.platform_overview?.role_breakdown || [];
  const snapshot = data?.common?.platform_overview?.platform_snapshot || {};
  const totalUsers = data?.common?.platform_overview?.total_users ?? 0;

  // Extract counts by role
  let studentCount = 0;
  let alumniCount = 0;
  let staffCount = 0;
  let studentVerified = 0;
  let alumniVerified = 0;

  roleBreakdown.forEach((item) => {
    if (item.role === 'STUDENT') {
      studentCount = item.count;
      studentVerified = item.verified;
    } else if (item.role === 'ALUMNI') {
      alumniCount = item.count;
      alumniVerified = item.verified;
    } else if (item.role === 'PLACEMENT_CELL') {
      staffCount = item.count;
    }
  });

  // Fallback to snapshot if breakdown was empty
  if (studentCount === 0 && snapshot.total_students) studentCount = snapshot.total_students;
  if (alumniCount === 0 && snapshot.total_alumni) alumniCount = snapshot.total_alumni;

  const chartData = [
    { name: 'Students', value: studentCount, color: '#059669' }, // Emerald
    { name: 'Alumni', value: alumniCount, color: '#2563EB' },   // Royal Blue
    { name: 'Placement Cell', value: staffCount, color: '#D97706' }, // Warm Amber
  ].filter((item) => item.value > 0);

  // If no data available, provide clean placeholder
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Students', value: 1, color: '#059669' },
    { name: 'Alumni', value: 1, color: '#2563EB' },
  ];

  const studentPctVerified = studentCount > 0 ? ((studentVerified / studentCount) * 100).toFixed(0) : '100';
  const alumniPctVerified = alumniCount > 0 ? ((alumniVerified / alumniCount) * 100).toFixed(0) : '100';

  return (
    <ChartCard
      title="Platform Population Census"
      subtitle="Distribution of registered members by institutional role"
      heightClass="h-64"
    >
      <div className="w-full h-full flex flex-col justify-between">
        <div className="w-full flex-1 min-h-[190px]">
          <DistributionDonutChart data={displayData} centerLabel="Total Members" />
        </div>

        {/* Verification Subtitle Pills */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Students: <strong className="text-slate-700">{studentCount}</strong> ({studentPctVerified}% ver.)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Alumni: <strong className="text-slate-700">{alumniCount}</strong> ({alumniPctVerified}% ver.)</span>
          </span>
          {staffCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span>Staff: <strong className="text-slate-700">{staffCount}</strong></span>
            </span>
          )}
        </div>
      </div>
    </ChartCard>
  );
}
