/**
 * AlumiBridge Analytics - Exhaustive Filter Dropdown Options
 * Mapped 1:1 to Django database models and enums.
 *
 * NOTE: Recruitment Hiring Mode is deliberately excluded as it is not part of this project.
 */

// 1. Overview & Common Filters
export const ACADEMIC_YEARS = [
  { value: '', label: 'All Years' },
  { value: '2025', label: '2025 (Current Cycle)' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' },
];

export const DEPARTMENTS = [
  { value: '', label: 'All Departments' },
  { value: '27', label: 'Computer Science & Engineering (CSE)' },
  { value: '28', label: 'Information Technology (IT)' },
  { value: '29', label: 'Electronics & Communication (ECE)' },
  { value: '31', label: 'Mechanical Engineering (ME)' },
  { value: '32', label: 'Civil Engineering (CE)' },
  { value: '30', label: 'Electrical Engineering (EE)' },
  { value: '33', label: 'AI & Data Science (AIDS)' },
  { value: '35', label: 'Chemical Engineering (BCH)' },
  { value: '22', label: 'Computer Engineering (BCE)' },
  { value: '23', label: 'Electronics & Comm. (BEC)' },
  { value: '24', label: 'Mechanical Eng. (BME)' },
  { value: '25', label: 'Electrical Eng. (BEE)' },
  { value: '26', label: 'Civil Eng. (BCV)' },
  { value: '34', label: 'Automobile Engineering (BAM)' },
];

export const GRADUATION_BATCHES = [
  { value: '', label: 'All Batches' },
  { value: '44', label: 'Batch 2022 – 2026' },
  { value: '43', label: 'Batch 2021 – 2025' },
  { value: '42', label: 'Batch 2020 – 2024' },
  { value: '41', label: 'Batch 2019 – 2023' },
  { value: '40', label: 'Batch 2018 – 2022' },
  { value: '39', label: 'Batch 2017 – 2021' },
  { value: '38', label: 'Batch 2016 – 2020' },
];

export const DATE_RANGES = [
  { value: '12m', label: 'Last 12 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

// 2. Student Dashboard Filters
export const STUDENT_SEMESTERS = [
  { value: '', label: 'All Semesters' },
  { value: '8', label: 'Semester 8 (Final Sem)' },
  { value: '7', label: 'Semester 7 (Pre-Final)' },
  { value: '6', label: 'Semester 6 (3rd Year)' },
  { value: '5', label: 'Semester 5 (3rd Year)' },
  { value: '4', label: 'Semester 4 (2nd Year)' },
  { value: '3', label: 'Semester 3 (2nd Year)' },
  { value: '1-2', label: 'Semester 1 & 2 (1st Year)' },
];

export const SKILL_CATEGORIES = [
  { value: '', label: 'All Skill Categories' },
  { value: 'PROGRAMMING_LANGUAGE', label: 'Programming Languages' },
  { value: 'WEB_FRAMEWORK', label: 'Web Frameworks' },
  { value: 'DATABASE', label: 'Databases' },
  { value: 'CLOUD_TOOL', label: 'Cloud & DevOps' },
  { value: 'CORE_SUBJECT', label: 'Core Engineering Subjects' },
  { value: 'CERTIFICATION', label: 'Certifications' },
];

export const OPPORTUNITY_TYPES = [
  { value: '', label: 'All Opportunity Types' },
  { value: 'PLACEMENT', label: 'Full-Time Placement' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

export const WORK_MODES = [
  { value: '', label: 'All Work Modes' },
  { value: 'ON_SITE', label: 'On-Site' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
];

// 3. Alumni Dashboard Filters
export const ALUMNI_BATCH_RANGES = [
  { value: '', label: 'All Alumni Batches' },
  { value: 'recent', label: 'Recent Graduates (2020 – 2025)' },
  { value: 'mid', label: 'Mid-Career Alumni (2015 – 2019)' },
  { value: 'senior', label: 'Senior Leaders (2010 – 2014)' },
  { value: 'executive', label: 'Executive / Founders (< 2010)' },
];

export const ALUMNI_JOB_CATEGORIES = [
  { value: '', label: 'All Job Categories' },
  { value: 'SOFTWARE', label: 'Software & Engineering' },
  { value: 'DATA_SCIENCE', label: 'Data Science & AI' },
  { value: 'PRODUCT_MANAGEMENT', label: 'Product Management' },
  { value: 'DEVOPS_CLOUD', label: 'DevOps & Cloud Engineering' },
  { value: 'SECURITY', label: 'Cyber Security' },
  { value: 'DESIGN', label: 'Design & UI/UX' },
  { value: 'BUSINESS_SALES', label: 'Business & Sales' },
  { value: 'OTHER', label: 'Other Categories' },
];

export const COMPANY_TIERS = [
  { value: '', label: 'All Company Tiers' },
  { value: 'SUPER_DREAM', label: 'Super Dream (> 12 LPA)' },
  { value: 'DREAM', label: 'Dream (8 – 12 LPA)' },
  { value: 'UNICORN', label: 'Unicorn Startups' },
  { value: 'CORE', label: 'Core Engineering' },
  { value: 'REGULAR', label: 'Mass Recruiter / IT Services' },
  { value: 'GOVT_PSU', label: 'Govt / PSU' },
];

export const COMPANY_SIZES = [
  { value: '', label: 'All Company Sizes' },
  { value: 'STARTUP', label: 'Startup (1–20)' },
  { value: 'SMALL', label: 'Small (21–50)' },
  { value: 'MEDIUM', label: 'Medium (51–250)' },
  { value: 'LARGE', label: 'Large (251–1000)' },
  { value: 'ENTERPRISE', label: 'Enterprise (1000+)' },
];

export const EXPERIENCE_BRACKETS = [
  { value: '', label: 'All Experience Levels' },
  { value: '0-2', label: '0 – 2 Years (Entry / Associate)' },
  { value: '3-5', label: '3 – 5 Years (Mid-Level)' },
  { value: '6-10', label: '6 – 10 Years (Senior / Staff)' },
  { value: '10+', label: '10+ Years (Leadership / Exec)' },
];

// 4. Placement Cell Dashboard Filters (Hiring Mode excluded per requirements)
export const PLACEMENT_YEARS = [
  { value: '', label: 'All Multi-Year Cycles' },
  { value: '2025', label: 'Batch 2025 (Active Cycle)' },
  { value: '2024', label: 'Batch 2024' },
  { value: '2023', label: 'Batch 2023' },
  { value: '2022', label: 'Batch 2022' },
  { value: '2021', label: 'Batch 2021' },
  { value: '2020', label: 'Batch 2020' },
];

export const PLACEMENT_OFFER_TYPES = [
  { value: '', label: 'All Offer Types' },
  { value: 'FULL_TIME_PLACEMENT', label: 'Full-Time Placement' },
  { value: 'INTERNSHIP', label: 'Pre-Final Internship' },
];

export const SALARY_BANDS = [
  { value: '', label: 'All Salary Bands' },
  { value: '20+', label: 'Premier Product (> 20 LPA)' },
  { value: '12-20', label: 'Super Dream (12 – 20 LPA)' },
  { value: '8-12', label: 'Dream Tier (8 – 12 LPA)' },
  { value: '5-8', label: 'Core Engineering (5 – 8 LPA)' },
  { value: '3-5', label: 'Mass Recruitment (3 – 5 LPA)' },
  { value: 'under_3', label: 'Entry Level (< 3 LPA)' },
];
