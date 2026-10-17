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
 * 1. Graduation Batch
 * 2. Academic Department
 * 3. Career Job Category
 * 4. Industry Sector
 * 5. Company Tier
 * Supports both desktop 'horizontal' inline strip and mobile 'vertical' modal layout.
 *
 * @param {object} filters - Active filter states
 * @param {function} onChange - (key, value) => void
 * @param {string} layout - 'horizontal' | 'vertical'
 */
export default function AlumniFilters({ filters = {}, onChange, layout = 'horizontal' }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  if (layout === 'vertical') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Graduation Batch
          </label>
          <select
            value={filters.batch || ''}
            onChange={(e) => handleChange('batch', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Graduation Batch"
          >
            {GRADUATION_BATCHES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Department
          </label>
          <select
            value={filters.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Department"
          >
            {DEPARTMENTS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Job Category
          </label>
          <select
            value={filters.job_category || ''}
            onChange={(e) => handleChange('job_category', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Job Category"
          >
            {ALUMNI_JOB_CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Industry Sector
          </label>
          <select
            value={filters.industry || ''}
            onChange={(e) => handleChange('industry', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Industry Sector"
          >
            {ALUMNI_INDUSTRIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Company Tier
          </label>
          <select
            value={filters.company_tier || ''}
            onChange={(e) => handleChange('company_tier', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Company Tier"
          >
            {COMPANY_TIERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

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
