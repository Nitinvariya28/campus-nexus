import React from 'react';
import { Users, Building2, Briefcase, TrendingUp, MessageSquare } from 'lucide-react';
import KPIGrid from './KPIGrid';
import KPICard from './KPICard';

/**
 * OverviewKPIGrid Component
 * 6 Master Executive KPI Cards strictly displaying live data from the API.
 * Zero hardcoded mock numbers.
 *
 * Backed by GET /api/analytics/dashboard/?view=common
 *
 * @param {object} data - Aggregated dashboard payload from backend
 * @param {boolean} loading - Loading indicator for skeleton display
 * @param {object} filters - Active applied filters
 */
export default function OverviewKPIGrid({ data, loading = false, filters = {} }) {
  if (loading) {
    return (
      <KPIGrid>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white px-2.5 py-2 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2.5 h-[50px] animate-pulse"
          >
            <div className="w-7 h-7 rounded-md bg-slate-100 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-2 w-14 bg-slate-200 rounded" />
              <div className="h-3.5 w-20 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </KPIGrid>
    );
  }

  // 1. Total Registered Users & Role Breakdown from API
  const totalUsers = Number(data?.common?.platform_overview?.total_users ?? 0);
  const roleBreakdown = data?.common?.platform_overview?.role_breakdown || [];
  let studentCount = 0;
  let alumniCount = 0;
  let staffCount = 0;
  let totalVerified = 0;

  roleBreakdown.forEach((item) => {
    if (item.role === 'STUDENT') {
      studentCount = Number(item.count) || 0;
      totalVerified += Number(item.verified) || 0;
    } else if (item.role === 'ALUMNI') {
      alumniCount = Number(item.count) || 0;
      totalVerified += Number(item.verified) || 0;
    } else if (item.role === 'PLACEMENT_CELL') {
      staffCount = Number(item.count) || 0;
      totalVerified += Number(item.verified) || 0;
    }
  });

  // 2. Identity Verification Rate
  const verificationRate =
    totalUsers > 0 ? ((totalVerified / totalUsers) * 100).toFixed(1) : '0.0';

  // 3. Active Partner Recruiters
  const partnerCompanies = Number(
    data?.common?.company_landscape?.company_metrics?.active_companies ??
    data?.common?.platform_overview?.platform_snapshot?.total_companies ??
    0
  );

  // 4. Total Placement Offers & Distinct Placed
  const totalOffers = Number(
    data?.common?.placement_snapshot?.summary?.total_offers ??
    data?.common?.platform_overview?.platform_snapshot?.total_offers ??
    0
  );
  const distinctPlaced = Number(data?.common?.placement_snapshot?.summary?.distinct_students_placed ?? 0);

  // 5. Average Package (Campus)
  const avgLpa = data?.common?.placement_snapshot?.package_statistics?.average_lpa != null
    ? Number(data?.common?.placement_snapshot?.package_statistics?.average_lpa)
    : 0;

  // 6. Total Community Posts
  const totalPosts = Number(
    data?.common?.community_pulse?.total_posts ??
    data?.common?.platform_overview?.platform_snapshot?.total_posts ??
    0
  );

  // SVG Circular Gauge for Verification Card
  const radius = 10;
  const circumference = 2 * Math.PI * radius; // ~62.8
  const numericRate = parseFloat(verificationRate) || 0;
  const strokeDashoffset = circumference - (numericRate / 100) * circumference;

  const verificationGauge = (
    <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
      <svg className="w-7 h-7 transform -rotate-90">
        <circle
          cx="14"
          cy="14"
          r={radius}
          stroke="#E2E8F0"
          strokeWidth="2.5"
          fill="transparent"
        />
        <circle
          cx="14"
          cy="14"
          r={radius}
          stroke={numericRate > 0 ? '#059669' : '#CBD5E1'}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[8px] font-bold text-slate-700 font-mono">
        {Math.round(numericRate)}%
      </span>
    </div>
  );

  return (
    <KPIGrid>
      {/* Card 1: Registered Users */}
      <KPICard
        title="Registered Users"
        value={totalUsers}
        accentColor="indigo"
        icon={<Users />}
      />

      {/* Card 2: Identity Verification Rate with Circular Gauge */}
      <KPICard
        title="Verification Rate"
        value={`${verificationRate}%`}
        accentColor="emerald"
        customBadge={verificationGauge}
      />

      {/* Card 3: Active Partner Recruiters */}
      <KPICard
        title="Active Recruiters"
        value={partnerCompanies}
        accentColor="blue"
        icon={<Building2 />}
      />

      {/* Card 4: Total Placement Offers */}
      <KPICard
        title="Total Offers"
        value={totalOffers}
        accentColor="purple"
        icon={<Briefcase />}
      />

      {/* Card 5: Average Package */}
      <KPICard
        title="Average Package"
        value={avgLpa > 0 ? `₹ ${avgLpa.toFixed(1)} LPA` : '₹ 0.0 LPA'}
        accentColor="amber"
        icon={<TrendingUp />}
      />

      {/* Card 6: Community Posts */}
      <KPICard
        title="Community Posts"
        value={totalPosts}
        accentColor="rose"
        icon={<MessageSquare />}
      />
    </KPIGrid>
  );
}
