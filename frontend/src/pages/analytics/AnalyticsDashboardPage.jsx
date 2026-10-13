import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function AnalyticsDashboardPage() {
  return (
    <PlaceholderCard
      moduleName="Analytics"
      title="Role-Aware Analytics Dashboard"
      route="/analytics"
      description="Single-call assembler aggregating institutional overview and role-specific KPI cards (Student, Alumni, Placement Cell, Admin). Features user growth metrics, verification rates, and activity timelines."
      endpoints={[
        "GET /api/analytics/dashboard/ (Role-aware consolidated dashboard assembler)",
        "GET /api/analytics/platform/overview/ (User growth, active counts, registration timelines)"
      ]}
    />
  );
}
