import React from 'react';
import {
  ACADEMIC_YEARS,
  DEPARTMENTS,
  GRADUATION_BATCHES,
  STUDENT_SEMESTERS,
  PLACEMENT_STATUSES,
} from '../../../constants/analytics/filterOptions';

/**
 * Student Dashboard Contextual Filter Bar
 * Focuses strictly on student-specific cohort dimensions:
 * 1. Academic Year
 * 2. Graduation Batch (e.g. Batch 2021-2025, Batch 2022-2026)
 * 3. Academic Department (e.g. CSE, AI&DS, IT, ECE)
 * 4. Current Semester (Sem 1 to Sem 8)
 * 5. Placement Status (All Cohorts, Placed, Unplaced)
 *
 * All unrelated/clutter filters (Opportunity Type, Work Mode) have been deleted.
 *
 * @param {object} filters - Active filter states
 * @param {function} onChange - (key, value) => void
 */
export default function StudentFilters({ filters = {}, onChange }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="flex items-center gap-2 flex-nowrap shrink-0">
      {/* 1. Academic Year */}
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

      {/* 2. Graduation Batch */}
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

      {/* 3. Department */}
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

      {/* 4. Current Semester */}
      <select
        value={filters.semester || ''}
        onChange={(e) => handleChange('semester', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Current Semester"
      >
        {STUDENT_SEMESTERS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 5. Placement Status */}
      <select
        value={filters.placed_status || ''}
        onChange={(e) => handleChange('placed_status', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
        aria-label="Placement Status"
      >
        {PLACEMENT_STATUSES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
