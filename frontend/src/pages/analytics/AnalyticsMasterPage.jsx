import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/analytics/layout/DashboardLayout';
import { useDashboardFilters } from '../../hooks/analytics/useDashboardFilters';

import OverviewDashboard from './OverviewDashboard';
import StudentDashboard from './StudentDashboard';
import AlumniDashboard from './AlumniDashboard';
import PlacementDashboard from './PlacementDashboard';

const INITIAL_FILTER_STATE = {
  // Common / Overview
  year: '',
  department: '',
  batch: '',
  range: '12m',
  // Student Hub
  semester: '',
  skill_category: '',
  opportunity_type: '',
  work_mode: '',
  // Alumni Net
  batch_range: '',
  job_category: '',
  company_tier: '',
  company_size: '',
  experience_years: '',
  // Placement Cell (Hiring Mode excluded per project scope)
  placement_year: '',
  offer_type: '',
  salary_band: '',
};

/**
 * AnalyticsMasterPage
 * Master controller mounted at /analytics.
 * Handles:
 * 1. Synchronized navigation across the 4 modular dashboards
 * 2. Active contextual filter staging & applying
 * 3. Dedicated vertical scrolling layout with zero horizontal overflow
 *
 * NOTE: As requested for this phase, NO backend API calls are executed.
 * Each dashboard renders its clean, responsive analysis workspace.
 */
export default function AnalyticsMasterPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial dashboard from URL pathname
  const getDashboardFromPath = (path) => {
    if (path.includes('/student')) return 'student';
    if (path.includes('/alumni')) return 'alumni';
    if (path.includes('/placement')) return 'placement_cell';
    return 'common';
  };

  const [activeDashboard, setActiveDashboard] = useState(() => getDashboardFromPath(location.pathname));

  // Sync state if URL changes externally
  useEffect(() => {
    const fromPath = getDashboardFromPath(location.pathname);
    if (fromPath !== activeDashboard) {
      setActiveDashboard(fromPath);
    }
  }, [location.pathname]);

  const handleSelectDashboard = (id) => {
    setActiveDashboard(id);
    const pathMap = {
      common: '/analytics/overview',
      student: '/analytics/student',
      alumni: '/analytics/alumni',
      placement_cell: '/analytics/placement',
    };
    if (pathMap[id] && location.pathname !== pathMap[id]) {
      navigate(pathMap[id], { replace: true });
    }
  };

  // Filter state management (Staging, applying, and resetting per dashboard)
  const {
    stagedFilters,
    setFilterValue,
    applyFilters,
    resetFilters,
  } = useDashboardFilters(INITIAL_FILTER_STATE);

  const renderActiveDashboard = () => {
    switch (activeDashboard) {
      case 'student':
        return <StudentDashboard />;
      case 'alumni':
        return <AlumniDashboard />;
      case 'placement_cell':
        return <PlacementDashboard />;
      case 'common':
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <DashboardLayout
      activeDashboard={activeDashboard}
      onSelectDashboard={handleSelectDashboard}
      stagedFilters={stagedFilters}
      onFilterChange={setFilterValue}
      onApplyFilters={applyFilters}
      onResetFilters={resetFilters}
    >
      {renderActiveDashboard()}
    </DashboardLayout>
  );
}
