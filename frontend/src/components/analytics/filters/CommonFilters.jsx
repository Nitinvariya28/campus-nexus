import React from 'react';
import {
  ACADEMIC_YEARS,
  DEPARTMENTS,
  GRADUATION_BATCHES,
  DATE_RANGES,
} from '../../../constants/analytics/filterOptions';

/**
 * Common / Overview Dashboard Contextual Filters
 * Fields: Academic Year, Department, Graduation Batch, Date Range
 * Supports both desktop 'horizontal' inline strip and mobile 'vertical' modal layout.
 *
 * @param {object} filters - Active applied filters
 * @param {function} onChange - (key, value) => void
 * @param {string} layout - 'horizontal' | 'vertical'
 */
export default function CommonFilters({ filters = {}, onChange, layout = 'horizontal' }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  if (layout === 'vertical') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Academic Year
          </label>
          <select
            value={filters.year || ''}
            onChange={(e) => handleChange('year', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Academic Year"
          >
            {ACADEMIC_YEARS.map((opt) => (
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
            Date Range
          </label>
          <select
            value={filters.range || '12m'}
            onChange={(e) => handleChange('range', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Date Range"
          >
            {DATE_RANGES.map((opt) => (
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
      {/* Academic Year */}
      <select
        value={filters.year || ''}
        onChange={(e) => handleChange('year', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Academic Year"
      >
        {ACADEMIC_YEARS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Department */}
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

      {/* Graduation Batch */}
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

      {/* Date Range */}
      <select
        value={filters.range || '12m'}
        onChange={(e) => handleChange('range', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Date Range"
      >
        {DATE_RANGES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
