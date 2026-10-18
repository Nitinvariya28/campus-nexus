/**
 * AlumiBridge Community Subsystem Constants
 * Reference: COMMUNITY_UI_THEME_AND_DESIGN_SYSTEM.md and AlumiBridge Community Page.docx
 */

export const POST_TYPE_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'STUDENT', label: 'Student' },
  { id: 'ALUMNI', label: 'Alumni' },
  { id: 'PLACEMENT_CELL', label: 'Placement Cell' },
];

export const COMMUNITY_SIDEBAR_NAV = [
  {
    id: 'my-posts',
    label: 'Your Posts',
    path: '/community/my-posts',
    count: 12,
    icon: 'FileText',
  },
  {
    id: 'saved',
    label: 'Saved Posts',
    path: '/community/saved',
    count: 34,
    icon: 'Bookmark',
  },
  {
    id: 'manage-posts',
    label: 'Manage Your Posts',
    path: '/community/manage',
    icon: 'Settings',
  },
];

export const TRENDING_TOPICS = [
  { tag: '#InterviewExperience', count: 48, label: 'Interview Experience' },
  { tag: '#PlacementDrive', count: 36, label: 'Placement Drive' },
  { tag: '#CareerAdvice', count: 29, label: 'Career Advice' },
  { tag: '#Internship', count: 24, label: 'Internship' },
  { tag: '#DSA', count: 19, label: 'Data Structures' },
  { tag: '#General', count: 15, label: 'General Discussion' },
];

export const TOP_RECRUITING_COMPANIES = [
  { name: 'Amazon', role: 'SDE I / Intern', offers: 24 },
  { name: 'Microsoft', role: 'Software Engineer', offers: 18 },
  { name: 'TCS Digital', role: 'Digital Innovator', offers: 35 },
  { name: 'Infosys', role: 'Specialist Programmer', offers: 28 },
  { name: 'Morgan Stanley', role: 'Tech Analyst', offers: 12 },
];

export const ROLE_TYPES = {
  STUDENT: 'STUDENT',
  ALUMNI: 'ALUMNI',
  PLACEMENT_CELL: 'PLACEMENT_CELL',
  ADMIN: 'ADMIN',
};

export const ROLE_LABELS = {
  STUDENT: 'Student',
  ALUMNI: 'Alumni',
  PLACEMENT_CELL: 'Placement Cell',
  ADMIN: 'Admin',
};

export const POST_CATEGORY_FILTERS = [
  { id: 'interview', label: 'Interview Experience', tag: '#InterviewExperience' },
  { id: 'placement', label: 'Placement Drive', tag: '#PlacementDrive' },
  { id: 'career', label: 'Career Advice', tag: '#CareerAdvice' },
  { id: 'internship', label: 'Internship', tag: '#Internship' },
  { id: 'other', label: 'Other', tag: '#General' },
];

export const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'popular', label: 'Most Popular' },
];
