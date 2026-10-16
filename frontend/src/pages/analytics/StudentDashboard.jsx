import React from 'react';
import { GraduationCap, RefreshCw, AlertCircle } from 'lucide-react';
import { useAnalyticsData } from '../../hooks/analytics/useAnalyticsData';
import StudentKPIGrid from '../../components/analytics/kpi/StudentKPIGrid';
import {
  CohortATSReadinessDonutChart,
  DepartmentATSBenchmarkChart,
  UnplacedMissingSkillsChart,
  MarketDemandSupplyGapChart,
  SkillPlacementCorrelationChart,
  InstitutionalReadinessRadarChart,
  InterviewIntelligenceChart,
  LearningPlatformsChart,
  AIToolAdoptionChart,
  HighPayingTechnologiesChart,
  ActiveDrivesSkillScarcityChart,
} from '../../components/analytics/charts/student';

/**
 * StudentDashboard View Component (View 2)
 * Macro-level student career readiness, skill intelligence, and recruitment analytics.
 * 100% General Institutional Analytics across the student population.
 * Strictly consumes live API data from GET /api/analytics/dashboard/?view=student.
 * Zero hardcoded or mock fallback numbers.
 *
 * Modern Dynamic Grid Layout ("Some Full, Some Two, Some Three"):
 * - Row 1: 6 Master Headline Readiness KPI Cards (StudentKPIGrid)
 * - Row 2: [THREE COLUMNS (4+4+4 cols)] Resume Screening Health & Department Benchmarks
 *   - Cohort ATS Readiness Distribution (Donut Chart)
 *   - Department ATS Screening Benchmark (Horizontal Bars)
 *   - Unplaced Cohort Missing Technical Skills (Ranked Bar Chart)
 * - Row 3: [TWO COLUMNS (6+6 cols)] Market Demand vs Student Supply & Placement Correlation
 *   - Market Demand vs Student Supply Gap (Paired Bar Chart)
 *   - Skill-to-Placement Correlation (Dual-Axis Composed Chart)
 * - Row 4: [ONE FULL-WIDTH (12 cols)] Campus Recruitment Drive Talent Scarcity Executive Matrix
 *   - Active Drives Skill Scarcity Matrix (Hero Paired Bars & Critical Supply Flags)
 * - Row 5: [THREE COLUMNS (4+4+4 cols)] Student Upskilling, Platforms & AI Adoption Ecosystem
 *   - 6-Axis Placement Readiness Radar (Spider Hexagonal Radar)
 *   - Upskilling Platforms by Domain (Interactive Hub: Coding/DSA, Web Dev, Courses)
 *   - AI Assistant Adoption & Daily Study Hours (Interactive Hub: Why Used, Hours, Tools)
 * - Row 6: [TWO COLUMNS (5+7 cols)] Campus Interview Intelligence & High-Paying Tech Specializations
 *   - Campus Interview Preparation Intelligence (Difficulty Donut & Multi-Round Stages)
 *   - High-Paying Tech Specializations (Average LPA vs Peak CTC Dual Horizontal Bars)
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
            Institutional cohort technical readiness, resume ATS distribution, market skill deficits, and recruitment scarcity.
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

      {/* Row 1: Executive 6 Master Cohort Readiness Headline KPI Cards */}
      <section aria-label="Student Cohort Readiness KPIs">
        <StudentKPIGrid data={payload} loading={loading} filters={filters} />
      </section>

      {/* Row 2: [THREE COLUMNS (4+4+4 cols)] Resume Screening Health & Department Benchmarks */}
      <section aria-label="Resume Screening Health & Department Benchmarks">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <CohortATSReadinessDonutChart data={payload} loading={loading} />
          <DepartmentATSBenchmarkChart data={payload} loading={loading} />
          <UnplacedMissingSkillsChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 3: [TWO COLUMNS (6+6 cols)] Skills Deficit & Market Supply Gap */}
      <section aria-label="Skills Deficit & Market Supply Gap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <MarketDemandSupplyGapChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-6">
            <SkillPlacementCorrelationChart data={payload} loading={loading} />
          </div>
        </div>
      </section>

      {/* Row 4: [ONE FULL-WIDTH (12 cols)] Campus Recruitment Drive Talent Scarcity Executive Matrix */}
      <section aria-label="Campus Recruitment Drive Talent Scarcity Executive Matrix">
        <div className="w-full">
          <ActiveDrivesSkillScarcityChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 5: [THREE COLUMNS (4+4+4 cols)] Student Upskilling, Platforms & AI Adoption Ecosystem */}
      <section aria-label="Learning Platforms & AI Study Time Hub">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <InstitutionalReadinessRadarChart data={payload} loading={loading} />
          <LearningPlatformsChart data={payload} loading={loading} />
          <AIToolAdoptionChart data={payload} loading={loading} />
        </div>
      </section>

      {/* Row 6: [TWO COLUMNS (5+7 cols)] Interview Preparation & Tech Specialization Packages */}
      <section aria-label="Interview Prep Intelligence & Compensation Specializations">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <InterviewIntelligenceChart data={payload} loading={loading} />
          </div>
          <div className="lg:col-span-7">
            <HighPayingTechnologiesChart data={payload} loading={loading} />
          </div>
        </div>
      </section>
    </div>
  );
}
