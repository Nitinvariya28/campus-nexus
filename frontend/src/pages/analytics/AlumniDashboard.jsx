import React from 'react';
import { Briefcase, RefreshCw, AlertCircle, Users } from 'lucide-react';
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
 * Modern Dynamic Grid Layout ("Some Full, Some Two, Some Three"):
 * - Row 1: 6 Master Headline Readiness KPI Cards (AlumniKPIGrid)
 * - Row 2: [THREE COLUMNS (4+4+4 cols)] Demographics, Sectors & Roles Core Triad
 *   - Global Geographic Footprint (Donut of 6 Hubs)
 *   - Industry Sector Representation (Horizontal Bars)
 *   - Career Specialization Bands (Donut of 6 Domains)
 * - Row 3: [TWO COLUMNS (6+6 cols)] Experience Tiers & Career Trajectories
 *   - Experience by Corporate Tier & Domain (Grouped Bars + Tabs)
 *   - Career Evolution Across Batches (Stacked Bar / Area)
 * - Row 4: [ONE FULL-WIDTH (12 cols)] Campus Recruitment & Alumni Hiring Bridge Executive Matrix
 *   - Alumni Campus Hiring Bridge Hero Matrix (Open Corporate Drives vs Alumni Inside)
 * - Row 5: [THREE COLUMNS (4+4+4 cols)] Technical Stack, Department Alignment & Seniority Hierarchy
 *   - Production Tech Stack (Ranked Horizontal Bars)
 *   - Academic Department Career Alignment (Grouped Bars)
 *   - Job Titles & Seniority Progression (Ranked Bars)
 * - Row 6: [TWO COLUMNS (5+7 cols)] Corporate Tiers & Employer Footprint
 *   - Employer Corporate Tier Breakdown (Donut Chart)
 *   - Top Employer Organizations Hub (Horizontal Dual-Bars)
 *
 * @param {object} filters - Active applied filters from FilterBar
 */
export default function AlumniDashboard({ filters = {} }) {
  const { data, loading, error, refetch } = useAnalyticsData('alumni', filters);

  const payload = data?.data || data;

  return (
    <div className="space-y-6">
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

      {/* Row 2: [THREE COLUMNS (4+4+4 cols)] Demographics, Sectors & Roles Core Triad */}
      <section aria-label="Demographics, Sectors and Role Specializations">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AlumniGeographicFootprintChart data={payload} loading={loading} />
          <AlumniIndustryDomainChart data={payload} loading={loading} />
          <div className="md:col-span-2 xl:col-span-1">
            <AlumniJobCategoryDonutChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 3: [TWO COLUMNS (6+6 cols)] Experience Tiers & Career Evolution */}
      <section aria-label="Experience Thresholds and Career Evolution">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <AlumniExperienceTierMatrixChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-6">
            <AlumniBatchCareerEvolutionChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 4: [ONE FULL-WIDTH (12 cols)] Campus Recruitment & Alumni Hiring Bridge */}
      <section aria-label="Alumni Campus Hiring Bridge Executive Matrix">
        <div className="w-full">
          <AlumniHiringBridgeMatrixChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 5: [THREE COLUMNS (4+4+4 cols)] Technical Stack, Department Alignment & Seniority Hierarchy */}
      <section aria-label="Technical Stack, Department Alignment and Seniority Progression">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AlumniTechCompetencyChart data={payload} loading={loading} />
          <AlumniDepartmentCareerAlignmentChart data={payload} loading={loading} />
          <div className="md:col-span-2 xl:col-span-1">
            <AlumniSeniorityHierarchyChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 6: [TWO COLUMNS (5+7 cols)] Corporate Tiers & Employer Organizations */}
      <section aria-label="Employer Tiers and Corporate Footprint">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <AlumniCompanyTierDonutChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-7">
            <AlumniTopEmployerOrganizationsChart data={payload} loading={loading} />
          </div>
        </div>
      </section>
    </div>
  );
}
