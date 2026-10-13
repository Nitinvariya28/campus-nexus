import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function PlacementAnalyticsPage() {
  return (
    <PlaceholderCard
      moduleName="Analytics"
      title="Placement Summary & Compensation Trends"
      route="/analytics/placements"
      description="Placement compensation metrics including highest CTC, average package, true median LPA, package distribution bands, and year-over-year compensation growth charts."
      endpoints={[
        "GET /api/analytics/placements/summary/ (CTC metrics, bands, unique placed count)",
        "GET /api/analytics/placements/companies/ (Hiring performance, PPO conversions)"
      ]}
    />
  );
}
