import React from 'react';
import {
  Award,
  Briefcase,
  TrendingUp,
  Building2,
  Sparkles,
  Zap,
} from 'lucide-react';
import KPIGrid from './KPIGrid';
import KPICard from './KPICard';

/**
 * PlacementKPIGrid Component
 * 6 Master Headline Placement KPIs for the Placement Cell Dashboard.
 * Strictly consumes live API data from GET /api/analytics/dashboard/?view=placement_cell.
 * Zero hardcoded mock numbers.
 *
 * @param {object} data - Aggregated dashboard payload from backend
 * @param {boolean} loading - Loading indicator
 * @param {object} filters - Active applied filters
 */
export default function PlacementKPIGrid({ data, loading = false, filters = {} }) {
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

  const pcData = data?.placement_cell || {};
  const commonData = data?.common || {};

  const placementKpis = pcData.placement_kpis || commonData.placement_snapshot || {};
  const summary = placementKpis.summary || {};
  const packageStats = placementKpis.package_statistics || {};
  const trends = placementKpis.trends || {};
  const cohortOutcomes = pcData.cohort_outcomes || {};
  const recruiterHealth = pcData.recruiter_health || {};

  // 1. Campus Placement Rate (%)
  const batchCoverage = cohortOutcomes.placement_coverage?.by_batch || [];
  const activeBatch = batchCoverage[0] || {};
  const placementRateVal =
    activeBatch.coverage_pct != null
      ? Number(activeBatch.coverage_pct).toFixed(1)
      : summary.placement_rate != null
      ? Number(summary.placement_rate).toFixed(1)
      : '—';
  const placedCount = activeBatch.placed_students ?? summary.distinct_students_placed ?? 0;
  const eligibleCount = activeBatch.eligible_students ?? summary.total_offers ?? 0;

  // Interactive radial gauge for placement rate
  const numericRate = parseFloat(placementRateVal) || 0;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(numericRate, 100) / 100) * circumference;

  const placementGauge = (
    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
      <svg className="w-8 h-8 -rotate-90">
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke="#E2E8F0"
          strokeWidth="3"
          fill="transparent"
        />
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke={numericRate >= 75 ? '#059669' : numericRate >= 60 ? '#D97706' : '#E11D48'}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[8px] font-black text-slate-700 font-mono">
        {Math.round(numericRate)}%
      </span>
    </div>
  );

  // 2. Total Offers Extended
  const totalOffersRaw = summary.total_offers;
  const totalOffers = totalOffersRaw != null ? `${Number(totalOffersRaw).toLocaleString()} Offers` : '—';
  const multiOfferStudents = summary.multiple_offer_students || 0;

  // 3. Institutional Average Package (CTC)
  const avgLpaRaw = packageStats.average_lpa;
  const avgLpa = avgLpaRaw != null ? `₹ ${Number(avgLpaRaw).toFixed(1)} LPA` : '—';
  const medianLpa = packageStats.median_lpa != null ? Number(packageStats.median_lpa).toFixed(1) : '—';
  const maxLpa = packageStats.maximum_lpa != null ? Number(packageStats.maximum_lpa).toFixed(1) : '—';

  // 4. Distinct Hiring Corporate Partners
  const yearlySummary = trends.yearly_summary || [];
  const latestYearRecruiters = yearlySummary.length > 0
    ? yearlySummary[yearlySummary.length - 1]?.distinct_companies
    : null;
  const calculatedActiveRecruiters =
    (recruiterHealth.recruiter_health?.repeat_recruiters?.length || 0) +
    (recruiterHealth.recruiter_health?.new_recruiters?.length || 0);
  const distinctCompanies =
    latestYearRecruiters ??
    (recruiterHealth.company_outcomes?.length > 0 ? recruiterHealth.company_outcomes.length : null) ??
    (calculatedActiveRecruiters > 0 ? calculatedActiveRecruiters : null);
  const distinctCompaniesDisplay = distinctCompanies != null ? `${distinctCompanies} Companies` : '—';
  const newRecruitersCount = recruiterHealth.recruiter_health?.new_recruiters?.length || 0;

  // 5. Tier-1 & Dream Share (%)
  const tierOutcomes = placementKpis.tier_outcomes || [];
  let tier1Count = 0;
  let totalTierOffers = 0;
  tierOutcomes.forEach((t) => {
    const c = Number(t.total_offers) || 0;
    totalTierOffers += c;
    const tierName = (t.company__company_tier || '').toUpperCase();
    if (tierName.includes('SUPER') || tierName.includes('DREAM') || tierName.includes('UNICORN')) {
      tier1Count += c;
    }
  });
  const tier1Share = totalTierOffers > 0
    ? `${((tier1Count / totalTierOffers) * 100).toFixed(1)}%`
    : '—';

  // 6. PPO & Internship-to-FTE Conversion Rate
  const internConv = recruiterHealth.internship_conversion || {};
  const convRateRaw = internConv.conversion_rate_pct;
  const ppoRate = convRateRaw != null ? `${Number(convRateRaw).toFixed(1)}%` : '—';
  const convertedCount = internConv.converted_to_ppo_or_fte ?? 0;
  const eligibleInterns = internConv.eligible_internships ?? 0;

  return (
    <KPIGrid>
      {/* KPI 1: Placement Rate */}
      <KPICard
        title="Placement Rate"
        value={placementRateVal !== '—' ? `${placementRateVal}%` : '—'}
        accentColor="emerald"
        customBadge={placementGauge}
      />

      {/* KPI 2: Total Offers */}
      <KPICard
        title="Total Offers"
        value={totalOffers}
        icon={<Briefcase />}
        accentColor="blue"
      />

      {/* KPI 3: Average Package */}
      <KPICard
        title="Average Package"
        value={avgLpa}
        icon={<TrendingUp />}
        accentColor="indigo"
      />

      {/* KPI 4: Active Recruiters */}
      <KPICard
        title="Active Recruiters"
        value={distinctCompaniesDisplay}
        icon={<Building2 />}
        accentColor="purple"
      />

      {/* KPI 5: Tier-1 / Dream Share */}
      <KPICard
        title="Tier-1 / Dream Share"
        value={tier1Share}
        icon={<Sparkles />}
        accentColor="amber"
      />

      {/* KPI 6: PPO Conversion */}
      <KPICard
        title="PPO Conversion"
        value={ppoRate}
        icon={<Zap />}
        accentColor="rose"
      />
    </KPIGrid>
  );
}
