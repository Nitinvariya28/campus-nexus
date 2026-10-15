import React from 'react';
import { GraduationCap } from 'lucide-react';
import EmptyDashboardWorkspace from '../../components/analytics/states/EmptyDashboardWorkspace';

/**
 * StudentDashboard View Component (View 2)
 * Displays the Student Dashboard layout with clean empty analysis workspace.
 * Zero API calls executed during this layout & navigation verification phase.
 */
export default function StudentDashboard() {
  return (
    <EmptyDashboardWorkspace
      title="Student Dashboard"
      subtitle="General student cohort ATS readiness distributions, market skill gaps, and verified recruitment opportunities."
      badge="● Student Intelligence"
      icon={GraduationCap}
    />
  );
}
