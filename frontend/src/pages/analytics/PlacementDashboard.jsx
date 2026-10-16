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
 * Modern Dynamic Grid Layout ("Some Full, Some Two, Some Three"):
 * - Row 1: 6 Master Headline Placement KPI Cards (PlacementKPIGrid)
 * - Row 2: [THREE COLUMNS (4+4+4 cols)] Department Conversion & Package Tiers
 *   - Visual 1: Department Placement Conversion Benchmark (Horizontal Bars with Target Toggles)
 *   - Visual 2: Recruiter Compensation Tier Distribution (Recharts Donut + 4 Tiers)
 *   - Visual 3: Placement Offer Type Split (FTE vs PPO vs Internship Donut)
 * - Row 3: [TWO COLUMNS (6+6 cols)] Package Distribution & Longitudinal Trajectory
 *   - Visual 4: Salary Package Brackets Histogram (CTC Brackets with Median Callout)
 *   - Visual 5: Multi-Year Placement Conversion Trajectory (Dual-Axis Composed Chart 2020-2025)
 * - Row 4: [ONE FULL-WIDTH (12 cols)] Corporate Recruiter Talent Absorption Hero Matrix
 *   - Visual 6: Recruiter Absorption Hero Matrix (Paired Bars with Interactive Tier Filter Tabs)
 * - Row 5: [THREE COLUMNS (4+4+4 cols)] Compensation Spread & Recruiter Pipeline Health
 *   - Visual 7: Department CTC Spread Benchmark (Average vs Highest LPA Comparison)
 *   - Visual 8: Hiring Industry Sector Distribution (Finance, IT, Consulting, Healthcare)
 *   - Visual 9: Recruiter Retention & Pipeline Health (Repeat, First-Time, Lapsed with Drill-Down)
 * - Row 6: [TWO COLUMNS (5+7 cols)] Recruiter Concentration & Department Unplaced Backlog
 *   - Visual 10: Top Recruiting Employers by Headcount (Donut Chart + Leaderboard)
 *   - Visual 11: Department Eligibility vs Placed Candidates (TPO Operational Inventory)
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

      {/* Row 2: [THREE COLUMNS (4+4+4 cols)] Department Conversion & Package Tiers */}
      <section aria-label="Department Conversion & Compensation Tier Breakdown">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <DepartmentPlacementConversionChart data={payload} loading={loading} />
          <RecruiterCompensationTierDonutChart data={payload} loading={loading} />
          <PlacementOfferTypeSplitChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 3: [TWO COLUMNS (6+6 cols)] Package Distribution & Longitudinal Trajectory */}
      <section aria-label="Salary Distribution & Multi-Year Trajectory">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <SalaryPackageHistogramChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-6">
            <MultiYearPlacementTrajectoryChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 4: [ONE FULL-WIDTH (12 cols)] Corporate Recruiter Talent Absorption Hero Matrix */}
      <section aria-label="Corporate Recruiter Talent Absorption Hero Matrix">
        <RecruiterAbsorptionHeroMatrixChart data={payload} loading={loading} />
      </section>

      {/* Row 5: [THREE COLUMNS (4+4+4 cols)] Compensation Spread & Recruiter Pipeline Health */}
      <section aria-label="Department CTC Benchmark & Recruiter Pipeline Health">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <DepartmentSalaryComparisonChart data={payload} loading={loading} />
          <HiringIndustrySectorShareChart data={payload} loading={loading} />
          <RecruiterLoyaltyCohortChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 6: [TWO COLUMNS (5+7 cols)] Recruiter Concentration & Department Unplaced Backlog */}
      <section aria-label="Top Employers & Departmental Eligibility Inventory">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <TopHiringOrganizationsDonutChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-7">
            <DepartmentEligibilityVsPlacedChart data={payload} loading={loading} />
          </div>
        </div>
      </section>
    </div>
  );
}
