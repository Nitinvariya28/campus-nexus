/**
 * Metadata & Configuration for the 4 Modular Dashboards
 * Strictly aligned with DASHBOARD_PAGE_DESIGN_SPECIFICATION.md
 */

export const DASHBOARDS = [
  {
    id: 'common',
    key: 'overview',
    route: '/analytics/overview',
    title: 'Overview Analytics',
    subtitle: 'Key insights and institutional census statistics.',
    statusChip: '● Live Campus Data',
    icon: 'LayoutDashboard',
  },
  {
    id: 'student',
    key: 'student',
    route: '/analytics/student',
    title: 'Student Analytics',
    subtitle: 'Cohort readiness, skill gap intelligence, and verified opportunities.',
    statusChip: '● Student Intelligence',
    icon: 'GraduationCap',
  },
  {
    id: 'alumni',
    key: 'alumni',
    route: '/analytics/alumni',
    title: 'Alumni Analytics',
    subtitle: 'Alumni career paths, global footprint, and giving-back contributions.',
    statusChip: '● Alumni Network',
    icon: 'Briefcase',
  },
  {
    id: 'placement_cell',
    key: 'placement',
    route: '/analytics/placement',
    title: 'Placement Analytics',
    subtitle: 'Institutional outcomes, corporate partner retention, and CTC spread.',
    statusChip: '● Institutional Insights',
    icon: 'Building2',
  },
];

export const DEFAULT_DASHBOARD = 'common';
