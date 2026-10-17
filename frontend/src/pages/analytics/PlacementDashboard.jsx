import React from 'react';
import { Building2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAnalyticsData } from '../../hooks/analytics/useAnalyticsData';
import PlacementKPIGrid from '../../components/analytics/kpi/PlacementKPIGrid';
import {
  DepartmentPlacementConversionChart,
  RecruiterCompensationTierDonutChart,
  PlacementOfferTypeSplitChart,
  SalaryPackageHistogramChart,
  MultiYearPlacementTrajectoryChart,
  RecruiterAbsorptionHeroMatrixChart,
  DepartmentSalaryComparisonChart,
  HiringIndustrySectorShareChart,
  RecruiterLoyaltyCohortChart,
  TopHiringOrganizationsDonutChart,
  DepartmentEligibilityVsPlacedChart,
} from '../../components/analytics/charts/placement';

/**
 * PlacementDashboard View Component (View 4)
 * Institutional campus placement outcomes, corporate recruiter absorption footprints,
 * compensation tier distributions, and recruiter retention intelligence.
 * 100% General Institutional Analytics across the entire placement cell activity.
 * Strictly consumes live API data from GET /api/analytics/dashboard/?view=placement_cell.
 * Zero hardcoded or mock fallback numbers.
 *
 * Alternating Visual Rhythm & Generous Space Grid:
 * - Row 1: 6 Master Headline Placement KPI Cards (PlacementKPIGrid)
 * - Row 2: [ALTERNATING PAIR (7+5 cols)]
 *   - Visual 1: Department Placement Conversion Benchmark (Horizontal Bars - 7 cols)
 *   - Visual 2: Recruiter Compensation Tier Distribution (Donut 1 - 5 cols)
 * - Row 3: [ALTERNATING PAIR (7+5 cols) - THIS PLOT DO SMALL]
 *   - Visual 3: Recruiter Retention & Pipeline Health (Loyalty Cohort - 7 cols, compact/not stretched)
 *   - Visual 4: Salary Package Brackets Histogram (CTC Brackets Bar - 5 cols)
 * - Row 4: [FULL-WIDTH (12 cols) - SPACIOUS HERO MATRIX]
 *   - Visual 5: Corporate Recruiter Talent Absorption Hero Matrix (460px height, full breathing room - 12 cols)
 * - Row 5: [ALTERNATING PAIR (5+7 cols)]
 *   - Visual 6: Placement Offer Type Split (Donut 2: FTE vs PPO vs Internship - 5 cols)
 *   - Visual 7: Department Eligibility vs Placed Candidates (TPO Operational Inventory - 7 cols)
 * - Row 6: [ALTERNATING PAIR (7+5 cols)]
 *   - Visual 8: Hiring Industry Sector Share (Horizontal Bars - 7 cols)
 *   - Visual 9: Top Recruiting Employers by Headcount (Donut 3 + Leaderboard - 5 cols)
 * - Row 7: [FULL-WIDTH (12 cols) - ANY YOY DO SPACE SPACE]
 *   - Visual 10: Multi-Year Placement Conversion Trajectory (Longitudinal Area/Line with spacious YoY cycles & padding - 12 cols)
 * - Row 8: [FULL-WIDTH (12 cols) - DEPARTMENT CTC BENCHMARK]
 *   - Visual 11: Department CTC Spread Benchmark (Average vs Highest LPA - 12 cols)
 *
 * @param {object} filters - Active applied filters from FilterBar
 */
export default function PlacementDashboard({ filters = {} }) {
  const { data, loading, error, refetch } = useAnalyticsData('placement_cell', filters);

  const payload = data?.data || data;

  return (
    <div className="space-y-6">
      {/* Dashboard Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Placement Cell Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Campus recruitment outcomes, recruiter tier absorption footprint, longitudinal conversion trends, and corporate retention health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Updating...
            </span>
          )}
          {!loading && !error && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Placement Data
            </span>
          )}
        </div>
      </div>

      {/* Error Feedback Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Unable to load live placement analytics: {error}</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded-md font-semibold text-rose-800 transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Row 1: Executive 6 Master Placement Headline KPI Cards */}
      <section aria-label="Placement Cell Headline KPIs">
        <PlacementKPIGrid data={payload} loading={loading} filters={filters} />
      </section>

      {/* Row 2: [ALTERNATING PAIR (7+5 cols)] Department Conversion & Compensation Tiers */}
      <section aria-label="Department Placement Conversion & Compensation Tier Distribution">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <DepartmentPlacementConversionChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-5">
            <RecruiterCompensationTierDonutChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 3: [ALTERNATING PAIR (7+5 cols) - THIS PLOT DO SMALL] Recruiter Retention & CTC Histogram */}
      <section aria-label="Recruiter Retention Health & Salary Package Brackets">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <RecruiterLoyaltyCohortChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-5">
            <SalaryPackageHistogramChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 4: [FULL-WIDTH (12 cols)] Corporate Recruiter Talent Absorption Hero Matrix */}
      <section aria-label="Corporate Recruiter Talent Absorption Hero Matrix">
        <div className="w-full">
          <RecruiterAbsorptionHeroMatrixChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 5: [ALTERNATING PAIR (5+7 cols)] Offer Types Split & Eligibility vs Placed */}
      <section aria-label="Offer Type Split & Department Eligibility Inventory">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5">
            <PlacementOfferTypeSplitChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-7">
            <DepartmentEligibilityVsPlacedChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 6: [ALTERNATING PAIR (7+5 cols)] Industry Sector Share & Top Employers */}
      <section aria-label="Hiring Industry Sectors & Top Recruiting Partners">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <HiringIndustrySectorShareChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-5">
            <TopHiringOrganizationsDonutChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 7: [FULL-WIDTH (12 cols) - ANY YOY DO SPACE SPACE] Multi-Year Trajectory */}
      <section aria-label="Longitudinal Conversion Trajectory across Cycles">
        <div className="w-full">
          <MultiYearPlacementTrajectoryChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 8: [FULL-WIDTH (12 cols)] Department CTC Spread Benchmark */}
      <section aria-label="Department CTC Spread Benchmark">
        <div className="w-full">
          <DepartmentSalaryComparisonChart data={payload} loading={loading} />
        </div>
      </section>
    </div>
  );
}
