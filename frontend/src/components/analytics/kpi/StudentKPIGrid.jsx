import React from 'react';
import {
  Award,
  TrendingUp,
  Briefcase,
  Cpu,
  Zap,
} from 'lucide-react';
import KPIGrid from './KPIGrid';
import KPICard from './KPICard';

/**
 * StudentKPIGrid Component
 * 6 Primary Master Cohort Readiness & Career KPIs for the Student Dashboard.
 * Strictly consumes live API data from GET /api/analytics/dashboard/?view=student.
 * Zero hardcoded mock numbers.
 *
 * Layout:
 * - Standard 6-card responsive container: 1 col on mobile, 2-3 on tablet, 6 on desktop (KPIGrid).
 *
 * Master Metrics:
 * 1. Cohort Avg ATS Score (Speedometer radial gauge + % Day-1 Ready in subtitle)
 * 2. Cohort Placement Rate (% Placed, count, batch comparison)
 * 3. Campus Average Package (LPA average, median & peak recorded CTC)
 * 4. Top In-Demand Skill (Hero value: Skill Name e.g. "System Design", drives count)
 * 5. Highest Paying Skill (Hero value: Skill Name e.g. "CouchDB", avg & max LPA)
 * 6. Active Campus Drives (Total verified open drives & urgent deadline count)
 *
 * @param {object} data - Aggregated dashboard payload from backend (res.data)
 * @param {boolean} loading - Loading indicator
 * @param {object} filters - Active applied filters
 */
export default function StudentKPIGrid({ data, loading = false, filters = {} }) {
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

  const studentData = data?.student || {};
  const commonData = data?.common || {};

  // 1. Cohort Average Resume ATS Score & Screening Health
  const cohortAtsRaw =
    studentData.resume_cohort_health?.cohort_ats_summary?.average_ats_score ??
    studentData.cohort_metrics?.cohort_metrics?.avg_ats_score ??
    studentData.my_resume_health?.resume_overview?.cohort_avg_score;
  const cohortAts = cohortAtsRaw != null ? Number(cohortAtsRaw).toFixed(1) : '—';
  const totalResumes =
    studentData.resume_cohort_health?.cohort_ats_summary?.total_resumes_analyzed ??
    studentData.my_resume_health?.resume_overview?.total_resumes_uploaded ??
    0;

  // Drive-Ready Share for ATS Card subtitle
  const bandDist = studentData.resume_cohort_health?.ats_band_distribution || [];
  const excellentBand = bandDist.find((b) => b && (b.band?.includes('80') || b.band?.includes('Excellent'))) || {};
  const driveReadyPct =
    excellentBand.percentage != null
      ? Number(excellentBand.percentage).toFixed(1)
      : studentData.cohort_metrics?.cohort_metrics?.drive_ready_pct != null
      ? Number(studentData.cohort_metrics.cohort_metrics.drive_ready_pct).toFixed(1)
      : null;

  // Circular Speedometer Gauge for ATS Score
  const numericAts = parseFloat(cohortAts) || 0;
  const atsRadius = 15;
  const atsCircumference = 2 * Math.PI * atsRadius;
  const atsOffset = atsCircumference - (numericAts / 100) * atsCircumference;

  const atsGauge = (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={atsRadius}
          stroke="#E2E8F0"
          strokeWidth="3.5"
          fill="transparent"
        />
        <circle
          cx="20"
          cy="20"
          r={atsRadius}
          stroke={numericAts >= 75 ? '#059669' : numericAts >= 65 ? '#D97706' : '#E11D48'}
          strokeWidth="3.5"
          strokeDasharray={atsCircumference}
          strokeDashoffset={atsOffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[9px] font-extrabold text-slate-700 font-mono">
        {Math.round(numericAts)}
      </span>
    </div>
  );

  // 2. Cohort Placement Rate
  const batchCoverage = studentData.cohort_metrics?.placement_coverage?.by_batch || [];
  const activeBatch = batchCoverage[0] || {};
  const placementRateVal =
    activeBatch.coverage_pct != null
      ? Number(activeBatch.coverage_pct).toFixed(1)
      : commonData.placement_snapshot?.summary?.placement_rate != null
      ? Number(commonData.placement_snapshot.summary.placement_rate).toFixed(1)
      : '—';
  const placedCount = activeBatch.placed_students ?? commonData.placement_snapshot?.summary?.distinct_students_placed ?? 0;
  const eligibleCount = activeBatch.eligible_students ?? commonData.placement_snapshot?.summary?.total_offers ?? 0;

  // 3. Campus Average Package (LPA)
  const avgLpaVal = commonData.placement_snapshot?.package_statistics?.average_lpa;
  const avgLpa = avgLpaVal != null ? Number(avgLpaVal).toFixed(1) : '—';
  const medianLpaVal = commonData.placement_snapshot?.package_statistics?.median_lpa;
  const medianLpa = medianLpaVal != null ? Number(medianLpaVal).toFixed(1) : '—';
  const maxLpaVal = commonData.placement_snapshot?.package_statistics?.maximum_lpa;
  const maxLpa = maxLpaVal != null ? Number(maxLpaVal).toFixed(1) : '—';

  // 4. Top In-Demand Skill (Hero value: prominent skill name)
  const topRequiredList = studentData.market_skill_gaps?.market_demand_overview?.top_required_skills || [];
  const commonDemandList = commonData.skills_pulse?.top_in_demand_skills || [];
  const topDemandItem = topRequiredList[0] || commonDemandList[0] || {};
  const topDemandSkillName = topDemandItem.skill__name || topDemandItem.name || '—';
  const topDemandDrives = topDemandItem.opportunities_requiring_skill || topDemandItem.count || null;

  // 5. Highest Paying Skill (Hero value: prominent skill name)
  const pkgAssoc = studentData.market_skill_gaps?.package_associations || [];
  const topPayingItem = pkgAssoc[0] || {};
  const topPayingSkillName = topPayingItem.skill__name || '—';
  const topPayingAvgLpa = topPayingItem.average_package_lpa != null ? Number(topPayingItem.average_package_lpa).toFixed(1) : '—';
  const topPayingMaxLpa = topPayingItem.max_package_lpa != null ? Number(topPayingItem.max_package_lpa).toFixed(1) : null;

  // 6. Active Campus Drives
  const oppSummary = commonData.opportunities_snapshot?.inventory_summary || {};
  const activeDrives = Number(oppSummary.total_opportunities ?? 0);
  const urgentCount = Number(oppSummary.deadline_status?.active_deadline ?? 0);

  return (
    <KPIGrid>
      {/* 1. Cohort Average Resume ATS Score */}
      <KPICard
        title="Avg ATS Score"
        value={cohortAts !== '—' ? `${cohortAts} / 100` : '—'}
        accentColor="indigo"
        customBadge={atsGauge}
      />

      {/* 2. Cohort Placement Rate */}
      <KPICard
        title="Cohort Placement"
        value={placementRateVal !== '—' ? `${placementRateVal}%` : '—'}
        accentColor="emerald"
        icon={<Award />}
      />

      {/* 3. Campus Average Package */}
      <KPICard
        title="Average Package"
        value={avgLpa !== '—' ? `₹ ${avgLpa} LPA` : '—'}
        accentColor="amber"
        icon={<TrendingUp />}
      />

      {/* 4. Top In-Demand Skill */}
      <KPICard
        title="Top In-Demand Skill"
        value={topDemandSkillName}
        accentColor="blue"
        icon={<Cpu />}
        valueClassName="text-xs sm:text-sm font-bold tracking-tight text-slate-900 truncate"
      />

      {/* 5. Highest Paying Skill */}
      <KPICard
        title="Highest Paying Skill"
        value={topPayingSkillName}
        accentColor="purple"
        icon={<Zap />}
        valueClassName="text-xs sm:text-sm font-bold tracking-tight text-slate-900 truncate"
      />

      {/* 6. Active Campus Drives */}
      <KPICard
        title="Active Drives"
        value={activeDrives > 0 ? `${activeDrives} Drives` : `${activeDrives}`}
        accentColor="rose"
        icon={<Briefcase />}
      />
    </KPIGrid>
  );
}
