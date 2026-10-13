import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function CompanyAnalyticsPage() {
  return (
    <PlaceholderCard
      moduleName="Analytics"
      title="Company Landscape & Recruiter Footprint"
      route="/analytics/companies"
      description="Corporate recruiter tiers (Super Dream, Dream, Mass), industry sector breakdown, new vs repeat recruiter retention rates, and active hiring drive counts."
      endpoints={[
        "GET /api/analytics/companies/overview/ (Company tier distributions, leading recruiters)",
        "GET /api/analytics/opportunities/ (Job vs internship breakdown, work mode statistics)"
      ]}
    />
  );
}
