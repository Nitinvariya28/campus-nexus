import React from 'react';
import {
  GRADUATION_BATCHES,
  DEPARTMENTS,
  ALUMNI_JOB_CATEGORIES,
  ALUMNI_INDUSTRIES,
  COMPANY_TIERS,
} from '../../../constants/analytics/filterOptions';

/**
 * Alumni Dashboard Contextual Filter Bar
 * Focuses strictly on alumni-relevant dimensions:
 * 1. Graduation Batch (e.g. Batch 2016-2020, 2017-2021)
 * 2. Academic Department (e.g. CSE, AIDS, IT, ECE)
 * 3. Career Job Category (Software, DevOps, Data Science, Product, Security)
 * 4. Industry Sector (Finance, Healthcare, IT, Consulting)
 * 5. Company Tier (Super Dream, Dream, Unicorn, Regular)
 *
 * @param {object} filters - Active filter states
 * @param {function} onChange - (key, value) => void
 */
export default function AlumniFilters({ filters = {}, onChange }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="flex items-center gap-2 flex-nowrap shrink-0">
      {/* 1. Graduation Batch */}
      <select
        value={filters.batch || ''}
        onChange={(e) => handleChange('batch', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Graduation Batch"
      >
        {GRADUATION_BATCHES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 2. Department */}
      <select
        value={filters.department || ''}
        onChange={(e) => handleChange('department', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Department"
      >
        {DEPARTMENTS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 3. Job Category */}
      <select
        value={filters.job_category || ''}
        onChange={(e) => handleChange('job_category', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Job Category"
      >
        {ALUMNI_JOB_CATEGORIES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 4. Industry Sector */}
      <select
        value={filters.industry || ''}
        onChange={(e) => handleChange('industry', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Industry Sector"
      >
        {ALUMNI_INDUSTRIES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 5. Company Tier */}
      <select
        value={filters.company_tier || ''}
        onChange={(e) => handleChange('company_tier', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Company Tier"
      >
        {COMPANY_TIERS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
