/**
 * Metadata & Configuration for the 4 Modular Dashboards
 * Strictly aligned with DASHBOARD_PAGE_DESIGN_SPECIFICATION.md
 */

export const DASHBOARDS = [
  {
    id: 'common',
    key: 'overview',
    route: '/analytics/overview',
    title: 'Overview Dashboard',
    subtitle: 'Key insights and quick statistics about the AlumiBridge platform.',
    statusChip: '● Live Campus Data',
    icon: 'LayoutDashboard',
  },
  {
    id: 'student',
    key: 'student',
    route: '/analytics/student',
    title: 'Student Dashboard',
    subtitle: 'Cohort readiness, skill gap intelligence, and verified recruitment opportunities.',
    statusChip: '● Student Intelligence',
    icon: 'GraduationCap',
  },
  {
    id: 'alumni',
    key: 'alumni',
    route: '/analytics/alumni',
    title: 'Alumni Dashboard',
    subtitle: 'Alumni career distribution, industry footprint, and giving-back contributions.',
    statusChip: '● Alumni Network',
    icon: 'Briefcase',
  },
  {
    id: 'placement_cell',
    key: 'placement',
    route: '/analytics/placement',
    title: 'Placement Cell Dashboard',
    subtitle: 'Institutional outcomes, corporate partner retention, and student preparation queues.',
    statusChip: '● Institutional Insights',
    icon: 'Building2',
  },
];

export const DEFAULT_DASHBOARD = 'common';
