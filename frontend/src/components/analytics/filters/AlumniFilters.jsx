import React from 'react';
import {
  ALUMNI_BATCH_RANGES,
  DEPARTMENTS,
  ALUMNI_JOB_CATEGORIES,
  COMPANY_TIERS,
  COMPANY_SIZES,
  EXPERIENCE_BRACKETS,
} from '../../../constants/analytics/filterOptions';

/**
 * Alumni Dashboard Contextual Filters
 * Fields: Batch Range, Department, Job Category, Company Tier, Company Size, Experience Bracket
 */
export default function AlumniFilters({ filters = {}, onChange }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Batch Range */}
      <select
        value={filters.batch_range || ''}
        onChange={(e) => handleChange('batch_range', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Graduation Period"
      >
        {ALUMNI_BATCH_RANGES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Department */}
      <select
        value={filters.department || ''}
        onChange={(e) => handleChange('department', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Department"
      >
        {DEPARTMENTS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Job Category */}
      <select
        value={filters.job_category || ''}
        onChange={(e) => handleChange('job_category', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Job Category"
      >
        {ALUMNI_JOB_CATEGORIES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Company Tier */}
      <select
        value={filters.company_tier || ''}
        onChange={(e) => handleChange('company_tier', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Company Tier"
      >
        {COMPANY_TIERS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Company Size */}
      <select
        value={filters.company_size || ''}
        onChange={(e) => handleChange('company_size', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Company Size"
      >
        {COMPANY_SIZES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Experience Bracket */}
      <select
        value={filters.experience_years || ''}
        onChange={(e) => handleChange('experience_years', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Experience Bracket"
      >
        {EXPERIENCE_BRACKETS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
