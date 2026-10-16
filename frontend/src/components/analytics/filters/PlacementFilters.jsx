import React from 'react';
import {
  PLACEMENT_YEARS,
  DEPARTMENTS,
  PLACEMENT_OFFER_TYPES,
  SALARY_BANDS,
  COMPANY_TIERS,
} from '../../../constants/analytics/filterOptions';

/**
 * Placement Cell Contextual Filter Bar
 * Placement activity & institutional dimensions:
 * 1. Placement Year / Cycle (2025 Active, 2024, 2023...)
 * 2. Academic Department (CSE, IT, ECE, AIDS, EE, ME, CE)
 * 3. Offer Type (Full-Time Placement vs Summer Internship)
 * 4. Salary Band (>20 LPA, 12-20 LPA, 8-12 LPA, 5-8 LPA, 3-5 LPA)
 * 5. Company Tier (Super Dream, Dream, Unicorn, Regular)
 *
 * @param {object} filters - Active filter states
 * @param {function} onChange - (key, value) => void
 */
export default function PlacementFilters({ filters = {}, onChange }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 1. Placement Year / Cycle */}
      <select
        value={filters.placement_year || ''}
        onChange={(e) => handleChange('placement_year', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Placement Cycle"
      >
        {PLACEMENT_YEARS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 2. Department */}
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

      {/* 3. Offer Type */}
      <select
        value={filters.offer_type || ''}
        onChange={(e) => handleChange('offer_type', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Offer Type"
      >
        {PLACEMENT_OFFER_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 4. Salary Band */}
      <select
        value={filters.salary_band || ''}
        onChange={(e) => handleChange('salary_band', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs"
        aria-label="Salary Band"
      >
        {SALARY_BANDS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 5. Company Tier */}
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
    </div>
  );
}
