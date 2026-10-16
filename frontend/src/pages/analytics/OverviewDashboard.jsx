import React from 'react';
import { LayoutDashboard, RefreshCw, AlertCircle } from 'lucide-react';
import { useAnalyticsData } from '../../hooks/analytics/useAnalyticsData';
import OverviewKPIGrid from '../../components/analytics/kpi/OverviewKPIGrid';
import {
  PopulationCensusChart,
  GrowthTrajectoryChart,
  PackageDistributionChart,
  PackageTrendsChart,
  CompanyPresenceChart,
  DepartmentPlacementChart,
  TechStackPulseChart,
  CommunityEngagementChart,
  IndustryFootprintChart,
} from '../../components/analytics/charts/overview';

/**
 * OverviewDashboard View Component (View 1)
 * High-density enterprise campus analytics dashboard.
 * Matches official AlumiBridge visual design specification.
 *
 * Layout Architecture:
 * - Row 1: 6 Executive Master KPI Cards (Gauge on verification, role breakdown chips)
 * - Row 2: User Population Donut (with side table) & 12-Month Onboarding Growth
 * - Row 3: 3-Column Placement & Recruiter Benchmarks (Distribution, YoY Trends, Recruiter Rankings)
 * - Row 4: Academic Disciplines & Department Placement Performance
 * - Row 5: 3-Column Skills, Community & Industry Footprint (Tech Stack, Community Pulse, Industry Footprint)
 *
 * @param {object} filters - Active applied filters from FilterBar
 */
export default function OverviewDashboard({ filters = {} }) {
  const { data, loading, error, refetch } = useAnalyticsData('common', filters);

  const payload = data?.data || data;

  return (
    <div className="space-y-6">
      {/* Dashboard Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Campus Overview
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unified view of our community, opportunities, and platform growth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Updating...
            </span>
          )}
          {!loading && !error && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Campus Data
            </span>
          )}
        </div>
      </div>

      {/* Error Feedback Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Unable to load live analytics data: {error}</span>
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

      {/* Row 1: Executive 6 Master KPI Counter Cards */}
      <section aria-label="Executive KPI Metrics">
        <OverviewKPIGrid data={payload} loading={loading} filters={filters} />
      </section>

      {/* Row 2: Population Census & Onboarding Growth (5:7 Split) */}
      <section aria-label="Population and Growth Visualizations">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5">
            <PopulationCensusChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-7">
            <GrowthTrajectoryChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 3: 3-Column Placement & Recruiter Benchmarks Grid */}
      <section aria-label="Placement and Recruiter Benchmarks">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <PackageDistributionChart data={payload} loading={loading} />
          <PackageTrendsChart data={payload} loading={loading} />
          <CompanyPresenceChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 4: Academic Disciplines & Department Placement Performance */}
      <section aria-label="Academic Disciplines Analysis">
        <DepartmentPlacementChart data={payload} loading={loading} />
      </section>

      {/* Row 5: 3-Column Skills, Community & Industry Footprint */}
      <section aria-label="Skills, Community and Industry Analysis">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <TechStackPulseChart data={payload} loading={loading} />
          <CommunityEngagementChart data={payload} loading={loading} />
          <IndustryFootprintChart data={payload} loading={loading} />
        </div>
      </section>
    </div>
  );
}
