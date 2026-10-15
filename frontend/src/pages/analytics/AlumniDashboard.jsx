import React from 'react';
import { Briefcase } from 'lucide-react';
import EmptyDashboardWorkspace from '../../components/analytics/states/EmptyDashboardWorkspace';

/**
 * AlumniDashboard View Component (View 3)
 * Displays the Alumni Dashboard layout with clean empty analysis workspace.
 * Zero API calls executed during this layout & navigation verification phase.
 */
export default function AlumniDashboard() {
  return (
    <EmptyDashboardWorkspace
      title="Alumni Dashboard"
      subtitle="Alumni career trajectories, global employer footprint, and community mentorship contributions."
      badge="● Alumni Network"
      icon={Briefcase}
    />
  );
}
