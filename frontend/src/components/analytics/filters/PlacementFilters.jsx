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
 * 1. Placement Year / Cycle
 * 2. Academic Department
 * 3. Offer Type
 * 4. Salary Band
 * 5. Company Tier
 * Supports both desktop 'horizontal' inline strip and mobile 'vertical' modal layout.
 *
 * @param {object} filters - Active filter states
 * @param {function} onChange - (key, value) => void
 * @param {string} layout - 'horizontal' | 'vertical'
 */
export default function PlacementFilters({ filters = {}, onChange, layout = 'horizontal' }) {
  const handleChange = (key, value) => {
    if (onChange) onChange(key, value);
  };

  if (layout === 'vertical') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Placement Cycle / Year
          </label>
          <select
            value={filters.placement_year || ''}
            onChange={(e) => handleChange('placement_year', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Placement Cycle"
          >
            {PLACEMENT_YEARS.map((opt) => (
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
            Offer Type
          </label>
          <select
            value={filters.offer_type || ''}
            onChange={(e) => handleChange('offer_type', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Offer Type"
          >
            {PLACEMENT_OFFER_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Salary Band
          </label>
          <select
            value={filters.salary_band || ''}
            onChange={(e) => handleChange('salary_band', e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors"
            aria-label="Salary Band"
          >
            {SALARY_BANDS.map((opt) => (
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
      {/* 1. Placement Year / Cycle */}
      <select
        value={filters.placement_year || ''}
        onChange={(e) => handleChange('placement_year', e.target.value)}
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
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
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
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
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
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
        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-medium cursor-pointer transition-colors shadow-2xs shrink-0"
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
