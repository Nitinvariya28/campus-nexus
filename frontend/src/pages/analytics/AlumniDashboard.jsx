import React from 'react';
import { Briefcase, RefreshCw, AlertCircle } from 'lucide-react';
import { useAnalyticsData } from '../../hooks/analytics/useAnalyticsData';
import AlumniKPIGrid from '../../components/analytics/kpi/AlumniKPIGrid';
import {
  AlumniGeographicFootprintChart,
  AlumniIndustryDomainChart,
  AlumniJobCategoryDonutChart,
  AlumniExperienceTierMatrixChart,
  AlumniBatchCareerEvolutionChart,
  AlumniHiringBridgeMatrixChart,
  AlumniTechCompetencyChart,
  AlumniDepartmentCareerAlignmentChart,
  AlumniSeniorityHierarchyChart,
  AlumniCompanyTierDonutChart,
  AlumniTopEmployerOrganizationsChart,
} from '../../components/analytics/charts/alumni';

/**
 * AlumniDashboard View Component (View 3)
 * Macro-level alumni career trajectories, industry distribution, and campus contribution analytics.
 * 100% General Institutional Analytics across the entire alumni graduating population.
 * Strictly consumes live API data from GET /api/analytics/dashboard/?view=alumni.
 * Zero hardcoded or mock fallback numbers.
 *
 * Alternating Visual Rhythm & Generous Space Grid:
 * - Row 1: 6 Master Headline Readiness KPI Cards (AlumniKPIGrid)
 * - Row 2: [ALTERNATING PAIR (7+5 cols)]
 *   - Visual 1: Industry Sector Representation (Horizontal Bars - 7 cols)
 *   - Visual 2: Global Geographic Footprint (Donut 1 - 5 cols)
 * - Row 3: [ALTERNATING PAIR (7+5 cols) - ZERO DONUTS]
 *   - Visual 3: Career Evolution Across Batches (Stacked Area / Trajectory - 7 cols)
 *   - Visual 4: Experience by Corporate Tier & Domain (Grouped Bars + Tabs - 5 cols)
 * - Row 4: [FULL-WIDTH (12 cols) - SPACIOUS HERO MATRIX]
 *   - Visual 5: Alumni Campus Hiring Bridge Hero Matrix (Executive Referral Network - 12 cols)
 * - Row 5: [ALTERNATING PAIR (5+7 cols)]
 *   - Visual 6: Career Specialization Bands (Donut 2 - 5 cols)
 *   - Visual 7: Academic Department Career Alignment (Grouped Bars - 7 cols)
 * - Row 6: [ALTERNATING PAIR (7+5 cols)]
 *   - Visual 8: Production Tech Stack Pulse (Ranked Horizontal Bars - 7 cols)
 *   - Visual 9: Employer Corporate Tier Breakdown (Donut 3 - 5 cols)
 * - Row 7: [ALTERNATING PAIR (5+7 cols) - ZERO DONUTS]
 *   - Visual 10: Job Titles & Seniority Progression (Ranked Progression Bars - 5 cols)
 *   - Visual 11: Top Employer Organizations Hub (Horizontal Dual-Bars - 7 cols)
 *
 * @param {object} filters - Active applied filters from FilterBar
 */
export default function AlumniDashboard({ filters = {} }) {
  const { data, loading, error, refetch } = useAnalyticsData('alumni', filters);

  const payload = data?.data || data;

  return (
    <div className="space-y-4">
      {/* Dashboard Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Alumni Career & Network Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global footprint, corporate industry distribution, career seniority trajectories, and campus referral bridges.
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
              Live Network Data
            </span>
          )}
        </div>
      </div>

      {/* Error Feedback Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Unable to load live alumni analytics: {error}</span>
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

      {/* Row 1: Executive 6 Master Headline KPI Cards */}
      <section aria-label="Alumni Network Headline KPIs">
        <AlumniKPIGrid data={payload} loading={loading} filters={filters} />
      </section>

      {/* Row 2: [BALANCED 2-COL (6+6 cols)] Industry Sectors & Geographic Hubs */}
      <section aria-label="Industry Sectors and Geographic Footprint">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlumniIndustryDomainChart data={payload} loading={loading} />
          <AlumniGeographicFootprintChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 3: [BALANCED 2-COL (6+6 cols)] Career Evolution & Experience Matrix */}
      <section aria-label="Career Evolution Across Batches and Experience Tiers">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlumniBatchCareerEvolutionChart data={payload} loading={loading} />
          <AlumniExperienceTierMatrixChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 4: [FULL-WIDTH (12 cols)] Campus Recruitment & Alumni Hiring Bridge */}
      <section aria-label="Alumni Campus Hiring Bridge Executive Matrix">
        <div className="w-full">
          <AlumniHiringBridgeMatrixChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 5: [BALANCED 2-COL (6+6 cols)] Career Specialization & Department Alignment */}
      <section aria-label="Career Specialization Bands and Department Career Alignment">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlumniJobCategoryDonutChart data={payload} loading={loading} />
          <AlumniDepartmentCareerAlignmentChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 6: [BALANCED 2-COL (6+6 cols)] Tech Competency & Corporate Tiers */}
      <section aria-label="Production Tech Stack Pulse and Employer Corporate Tiers">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlumniTechCompetencyChart data={payload} loading={loading} />
          <AlumniCompanyTierDonutChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 7: [BALANCED 2-COL (6+6 cols)] Seniority Progression & Top Employers */}
      <section aria-label="Job Seniority Hierarchy and Top Employer Organizations">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlumniSeniorityHierarchyChart data={payload} loading={loading} />
          <AlumniTopEmployerOrganizationsChart data={payload} loading={loading} />
        </div>
      </section>
    </div>
  );
}
