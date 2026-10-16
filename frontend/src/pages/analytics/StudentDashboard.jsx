import React from 'react';
import { GraduationCap, RefreshCw, AlertCircle } from 'lucide-react';
import { useAnalyticsData } from '../../hooks/analytics/useAnalyticsData';
import StudentKPIGrid from '../../components/analytics/kpi/StudentKPIGrid';

/**
 * StudentDashboard View Component (View 2)
 * Macro-level student career readiness and technical intelligence engine.
 * Matches official AlumiBridge visual design specification.
 *
 * Layout Architecture:
 * - Top: 6 Master Cohort Readiness KPI Cards (StudentKPIGrid)
 * - Row 2: Cohort ATS Health Distribution & Missing Resume Keywords
 * - Row 3: Market Demand vs Student Supply Gap (Butterfly Chart)
 * - Row 4: Skill-to-Placement Correlation & 6-Axis Cohort Readiness
 * - Row 5: Interview Prep & Upskilling Platform Adoption
 * - Row 6: Live Campus Recruitment Drives Directory
 *
 * @param {object} filters - Active applied filters from FilterBar
 */
export default function StudentDashboard({ filters = {} }) {
  const { data, loading, error, refetch } = useAnalyticsData('student', filters);

  const payload = data?.data || data;

  return (
    <div className="space-y-6">
      {/* Dashboard Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Student Career Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Macro cohort technical readiness, resume ATS distribution, and market skill gap analytics.
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
              Live Cohort Data
            </span>
          )}
        </div>
      </div>

      {/* Error Feedback Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Unable to load live student analytics: {error}</span>
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

      {/* Row 1: Executive 6 Master Cohort Readiness KPI Cards */}
      <section aria-label="Student Cohort Readiness KPIs">
        <StudentKPIGrid data={payload} loading={loading} filters={filters} />
      </section>
    </div>
  );
}
