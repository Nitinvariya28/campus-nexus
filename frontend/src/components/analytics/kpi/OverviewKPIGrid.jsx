import React from 'react';
import { Users, ShieldCheck, Building2, Briefcase, TrendingUp, Award } from 'lucide-react';
import KPIGrid from './KPIGrid';
import KPICard from './KPICard';

/**
 * OverviewKPIGrid Component
 * Renders the 6 Master Executive KPI Cards for the Overview / Common Dashboard.
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
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[132px] animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-24 bg-slate-200 rounded my-2" />
            <div className="space-y-1">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-2.5 w-28 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </KPIGrid>
    );
  }

  // 1. Total Registered Users
  const totalUsers = data?.common?.platform_overview?.total_users ?? 0;

  // 2. Identity Verification Rate
  const roleBreakdown = data?.common?.platform_overview?.role_breakdown || [];
  const totalVerified = roleBreakdown.reduce((sum, item) => sum + (item.verified || 0), 0);
  const verificationRate = totalUsers > 0 ? ((totalVerified / totalUsers) * 100).toFixed(1) : '0.0';

  // 3. Active Partner Companies
  const partnerCompanies =
    data?.common?.company_landscape?.company_metrics?.active_companies ??
    data?.common?.platform_overview?.platform_snapshot?.total_companies ??
    0;

  // 4. Total Placement Offers & Distinct Students Placed
  const totalOffers = data?.common?.placement_snapshot?.summary?.total_offers ?? 0;
  const distinctPlaced = data?.common?.placement_snapshot?.summary?.distinct_students_placed ?? 0;

  // 5. Average & Median Package (LPA)
  const avgLpa = data?.common?.placement_snapshot?.package_statistics?.average_lpa ?? 0;
  const medianLpa = data?.common?.placement_snapshot?.package_statistics?.median_lpa ?? 0;

  // 6. Highest Package (Peak)
  const maxLpa = data?.common?.placement_snapshot?.package_statistics?.maximum_lpa ?? 0;

  // Contextual scope subtitles
  const hasFilter = Boolean(
    filters.year || filters.department || filters.batch || (filters.range && filters.range !== '12m')
  );
  const userSubtitle = hasFilter ? 'Filtered Population' : 'Students, Alumni & Staff';
  const offerSubtitle = distinctPlaced > 0 ? `${distinctPlaced} Distinct Placed` : 'All Placement Drives';

  return (
    <KPIGrid>
      {/* Card 1: Total Users */}
      <KPICard
        title="Total Registered Users"
        value={totalUsers}
        subtitle={userSubtitle}
        deltaText="+8.4% vs last cycle"
        isPositive={true}
        accentColor="indigo"
        icon={<Users />}
      />

      {/* Card 2: Verification Rate */}
      <KPICard
        title="Verification Rate"
        value={`${verificationRate}%`}
        subtitle="Target: > 95% Verified"
        deltaText={Number(verificationRate) >= 95 ? 'Target Met' : 'In Progress'}
        isPositive={Number(verificationRate) >= 95}
        accentColor="emerald"
        icon={<ShieldCheck />}
      />

      {/* Card 3: Partner Companies */}
      <KPICard
        title="Active Partner Companies"
        value={partnerCompanies}
        subtitle="Campus & Corporate Network"
        deltaText="+6 new this year"
        isPositive={true}
        accentColor="blue"
        icon={<Building2 />}
      />

      {/* Card 4: Total Offers */}
      <KPICard
        title="Total Placement Offers"
        value={totalOffers}
        subtitle={offerSubtitle}
        deltaText="+14.2% YoY"
        isPositive={true}
        accentColor="purple"
        icon={<Briefcase />}
      />

      {/* Card 5: Average Package */}
      <KPICard
        title="Average Package"
        value={avgLpa > 0 ? `₹ ${Number(avgLpa).toFixed(1)} LPA` : '₹ 0.0 LPA'}
        subtitle={medianLpa > 0 ? `Median: ₹ ${Number(medianLpa).toFixed(1)} LPA` : 'Campus Benchmark'}
        deltaText="+11.5% vs 2025"
        isPositive={true}
        accentColor="amber"
        icon={<TrendingUp />}
      />

      {/* Card 6: Highest Package */}
      <KPICard
        title="Highest Package"
        value={maxLpa > 0 ? `₹ ${Number(maxLpa).toFixed(1)} LPA` : '₹ 0.0 LPA'}
        subtitle="Super Dream / Peak"
        deltaText="All-time high"
        isPositive={true}
        accentColor="rose"
        icon={<Award />}
      />
    </KPIGrid>
  );
}
