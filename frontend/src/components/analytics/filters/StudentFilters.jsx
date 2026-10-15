import React from 'react';
import {
  ACADEMIC_YEARS,
  DEPARTMENTS,
  STUDENT_SEMESTERS,
  SKILL_CATEGORIES,
  OPPORTUNITY_TYPES,
  WORK_MODES,
} from '../../../constants/analytics/filterOptions';

/**
 * Student Dashboard Contextual Filters
 * Fields: Academic Year, Department, Current Semester, Skill Category, Opportunity Type, Work Mode
 */
export default function StudentFilters({ filters = {}, onChange }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Academic Year */}
      <select
        value={filters.year || ''}
        onChange={(e) => handleChange('year', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
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
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Department"
      >
        {DEPARTMENTS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Current Semester */}
      <select
        value={filters.semester || ''}
        onChange={(e) => handleChange('semester', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Current Semester"
      >
        {STUDENT_SEMESTERS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Skill Category */}
      <select
        value={filters.skill_category || ''}
        onChange={(e) => handleChange('skill_category', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Skill Category"
      >
        {SKILL_CATEGORIES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Opportunity Type */}
      <select
        value={filters.opportunity_type || ''}
        onChange={(e) => handleChange('opportunity_type', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Opportunity Type"
      >
        {OPPORTUNITY_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Work Mode */}
      <select
        value={filters.work_mode || ''}
        onChange={(e) => handleChange('work_mode', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Work Mode"
      >
        {WORK_MODES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
