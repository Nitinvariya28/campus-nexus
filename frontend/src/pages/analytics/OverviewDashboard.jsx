import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import EmptyDashboardWorkspace from '../../components/analytics/states/EmptyDashboardWorkspace';

/**
 * OverviewDashboard View Component (View 1)
 * Displays the Overview Dashboard layout with clean empty analysis workspace.
 * Zero API calls executed during this layout & navigation verification phase.
 */
export default function OverviewDashboard() {
  return (
    <EmptyDashboardWorkspace
      title="Overview Dashboard"
      subtitle="Macro-level institutional census, overarching placement benchmarks, and partner footprint."
      badge="● Live Campus Data"
      icon={LayoutDashboard}
    />
  );
}
