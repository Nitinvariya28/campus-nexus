import React from 'react';
import {
  GraduationCap,
  Briefcase,
  Globe2,
  Building2,
  Award,
  Users,
} from 'lucide-react';
import KPIGrid from './KPIGrid';
import KPICard from './KPICard';

/**
 * AlumniKPIGrid Component
 * 6 Primary Master Headline KPIs for the Alumni Network & Career Dashboard.
 * Strictly consumes live API data from GET /api/analytics/dashboard/?view=alumni.
 * Zero hardcoded mock numbers.
 *
 * Master Metrics:
 * 1. Total Alumni Network Size (Verified graduate profiles count)
 * 2. Mean Career Experience (Average post-graduation industry tenure in years)
 * 3. Global Tech Hubs (Count of active domestic and international tech centers)
 * 4. Leading Industry Sector (Dominant employing sector e.g. "Finance", headcount)
 * 5. Tier-1 & Unicorn Share (% in Super Dream, Dream & Unicorn firms)
 * 6. Alumni Hiring Bridge (Corporate recruiters with open drives where alumni work)
 *
 * @param {object} data - Aggregated dashboard payload from backend
 * @param {boolean} loading - Loading indicator
 * @param {object} filters - Active applied filters
 */
export default function AlumniKPIGrid({ data, loading = false, filters = {} }) {
  if (loading) {
    return (
      <KPIGrid>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between h-[132px] animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="w-7 h-7 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded my-2" />
            <div className="h-2.5 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </KPIGrid>
    );
  }

  const alumniData = data?.alumni || {};
  const careerPaths = alumniData.career_paths || {};
  const overview = careerPaths.alumni_overview || {};
  const demographics = careerPaths.employment_demographics || {};
  const companyInsights = careerPaths.company_insights || {};
  const contributions = alumniData.alumni_contributions || {};

  // 1. Total Alumni Network Size
  const totalAlumniRaw = overview.total_alumni_profiles;
  const totalAlumni = totalAlumniRaw != null ? Number(totalAlumniRaw).toLocaleString() : '—';

  // 2. Average Experience in Years
  const avgExpRaw = overview.average_experience_years;
  const avgExp = avgExpRaw != null ? `${Number(avgExpRaw).toFixed(1)} Yrs` : '—';

  // 3. Global Tech Hubs Count
  const locations = demographics.by_location || [];
  const globalHubsCount = locations.length > 0 ? `${locations.length} Hubs` : '—';
  const topHubName = locations[0]?.location ? locations[0].location.split(',')[0] : 'Global';

  // 4. Leading Industry Sector
  const industries = companyInsights.by_industry || [];
  const topIndustry = industries[0];
  const industryLabel = topIndustry?.current_company__industry || '—';
  const industryCount = topIndustry?.count || 0;
  const totalEmployedInIndustries = industries.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);
  const industryPct = totalEmployedInIndustries > 0
    ? `${((industryCount / totalEmployedInIndustries) * 100).toFixed(0)}% share`
    : 'Primary Sector';

  // 5. Tier-1 & Unicorn Share
  const tiers = companyInsights.by_tier || [];
  let tier1Count = 0;
  let totalTierCount = 0;
  tiers.forEach((t) => {
    const c = Number(t.count) || 0;
    totalTierCount += c;
    const tierName = (t.current_company__company_tier || '').toUpperCase();
    if (tierName.includes('SUPER') || tierName.includes('DREAM') || tierName.includes('UNICORN')) {
      tier1Count += c;
    }
  });
  const tier1Share = totalTierCount > 0
    ? `${((tier1Count / totalTierCount) * 100).toFixed(1)}%`
    : '—';

  // 6. Alumni Hiring Bridge
  const hiringBridge = contributions.alumni_hiring_bridge?.alumni_at_hiring_companies || [];
  const bridgeFirmsCount = hiringBridge.length > 0 ? `${hiringBridge.length} Firms` : '—';
  const totalBridgeAlumni = hiringBridge.reduce((acc, curr) => acc + (Number(curr.alumni_working_there) || 0), 0);

  return (
    <KPIGrid>
      {/* KPI 1: Total Alumni Network Size */}
      <KPICard
        title="Total Alumni Network"
        value={totalAlumni}
        icon={<GraduationCap />}
        accentColor="indigo"
        subtitle="Verified campus graduates"
      />

      {/* KPI 2: Mean Career Experience */}
      <KPICard
        title="Avg Career Experience"
        value={avgExp}
        icon={<Briefcase />}
        accentColor="blue"
        subtitle="Post-graduation industry tenure"
      />

      {/* KPI 3: Global Tech Hubs */}
      <KPICard
        title="Global Tech Hubs"
        value={globalHubsCount}
        icon={<Globe2 />}
        accentColor="emerald"
        subtitle={`Top: ${topHubName} & overseas hubs`}
      />

      {/* KPI 4: Dominant Industry Sector */}
      <KPICard
        title="Leading Industry"
        value={industryLabel}
        icon={<Building2 />}
        accentColor="purple"
        subtitle={`${industryCount} alumni (${industryPct})`}
      />

      {/* KPI 5: Tier-1 & Unicorn Share */}
      <KPICard
        title="Tier-1 / Unicorn Share"
        value={tier1Share}
        icon={<Award />}
        accentColor="amber"
        subtitle="Super Dream, Dream & Unicorns"
      />

      {/* KPI 6: Alumni Hiring Bridge */}
      <KPICard
        title="Alumni Hiring Bridge"
        value={bridgeFirmsCount}
        icon={<Users />}
        accentColor="rose"
        subtitle={`${totalBridgeAlumni} alumni inside hiring firms`}
      />
    </KPIGrid>
  );
}
