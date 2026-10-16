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
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[132px] animate-pulse"
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
  const radius = 15;
  const circumference = 2 * Math.PI * radius; // ~94.2
  const numericRate = parseFloat(verificationRate) || 0;
  const strokeDashoffset = circumference - (numericRate / 100) * circumference;

  const verificationGauge = (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="#E2E8F0"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke={numericRate > 0 ? '#059669' : '#CBD5E1'}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[9px] font-extrabold text-slate-700 font-mono">
        {Math.round(numericRate)}%
      </span>
    </div>
  );

  // Role Breakdown Chips for Card 1
  const userRoleChips = (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 mb-1">
        <span>Verified Identity Census</span>
      </div>
      <div className="flex items-center gap-1 text-[9px] font-semibold pt-1 border-t border-slate-100 flex-wrap">
        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
          Students {studentCount.toLocaleString()}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
          Alumni {alumniCount.toLocaleString()}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
          Staff {staffCount.toLocaleString()}
        </span>
      </div>
    </div>
  );

  return (
    <KPIGrid>
      {/* Card 1: Total Registered Users */}
      <KPICard
        title="Total Registered Users"
        value={totalUsers}
        accentColor="indigo"
        icon={<Users />}
        customFooter={userRoleChips}
      />

      {/* Card 2: Identity Verification Rate with Circular Gauge */}
      <KPICard
        title="Identity Verification Rate"
        value={`${verificationRate}%`}
        subtitle={
          totalUsers > 0
            ? `${totalVerified.toLocaleString()} / ${totalUsers.toLocaleString()} verified`
            : 'No users registered'
        }
        accentColor="emerald"
        customBadge={verificationGauge}
      />

      {/* Card 3: Active Partner Recruiters */}
      <KPICard
        title="Active Partner Recruiters"
        value={partnerCompanies}
        subtitle={partnerCompanies > 0 ? 'On-Campus & Off-Campus Network' : 'No partner recruiters recorded'}
        accentColor="blue"
        icon={<Building2 />}
      />

      {/* Card 4: Total Placement Offers */}
      <KPICard
        title="Total Placement Offers"
        value={totalOffers}
        subtitle={distinctPlaced > 0 ? `${distinctPlaced} Placed Students` : 'No placement records'}
        accentColor="purple"
        icon={<Briefcase />}
      />

      {/* Card 5: Average Package (Campus) */}
      <KPICard
        title="Average Package (Campus)"
        value={avgLpa > 0 ? `₹ ${avgLpa.toFixed(1)} LPA` : '₹ 0.0 LPA'}
        subtitle={avgLpa > 0 ? 'Campus Compensation Average' : 'No compensation data'}
        accentColor="amber"
        icon={<TrendingUp />}
      />

      {/* Card 6: Total Community Posts */}
      <KPICard
        title="Total Community Posts"
        value={totalPosts}
        subtitle={totalPosts > 0 ? 'Platform Discussions & Pulse' : 'No discussions posted'}
        accentColor="rose"
        icon={<MessageSquare />}
      />
    </KPIGrid>
  );
}
