import React from 'react';
import {
  PLACEMENT_YEARS,
  DEPARTMENTS,
  PLACEMENT_OFFER_TYPES,
  COMPANY_TIERS,
  SALARY_BANDS,
} from '../../../constants/analytics/filterOptions';

/**
 * Placement Cell Dashboard Contextual Filters
 * Fields: Placement Cycle Year, Department, Offer Category, Recruiter Tier, Salary Package Band
 * NOTE: Recruitment Hiring Mode is deliberately excluded as it is not part of this project.
 */
export default function PlacementFilters({ filters = {}, onChange }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Placement Cycle */}
      <select
        value={filters.placement_year || filters.year || ''}
        onChange={(e) => handleChange('placement_year', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Placement Cycle Year"
      >
        {PLACEMENT_YEARS.map((opt) => (
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

      {/* Offer Category */}
      <select
        value={filters.offer_type || ''}
        onChange={(e) => handleChange('offer_type', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Offer Category"
      >
        {PLACEMENT_OFFER_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Recruiter Tier */}
      <select
        value={filters.company_tier || ''}
        onChange={(e) => handleChange('company_tier', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Recruiter Tier"
      >
        {COMPANY_TIERS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Salary Package Band */}
      <select
        value={filters.salary_band || ''}
        onChange={(e) => handleChange('salary_band', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Salary Package Band"
      >
        {SALARY_BANDS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
