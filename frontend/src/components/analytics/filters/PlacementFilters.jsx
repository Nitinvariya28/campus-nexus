import React from 'react';
import SearchableFilterSelect from './SearchableFilterSelect';
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
 * Upgraded with searchable typeahead select dropdowns.
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
          <SearchableFilterSelect
            options={PLACEMENT_YEARS}
            value={filters.placement_year || ''}
            onChange={(val) => handleChange('placement_year', val)}
            placeholder="All Placement Cycles"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Department
          </label>
          <SearchableFilterSelect
            options={DEPARTMENTS}
            value={filters.department || ''}
            onChange={(val) => handleChange('department', val)}
            placeholder="All Departments"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Offer Type
          </label>
          <SearchableFilterSelect
            options={PLACEMENT_OFFER_TYPES}
            value={filters.offer_type || ''}
            onChange={(val) => handleChange('offer_type', val)}
            placeholder="All Offer Types"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Salary Band
          </label>
          <SearchableFilterSelect
            options={SALARY_BANDS}
            value={filters.salary_band || ''}
            onChange={(val) => handleChange('salary_band', val)}
            placeholder="All Salary Bands"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Company Tier
          </label>
          <SearchableFilterSelect
            options={COMPANY_TIERS}
            value={filters.company_tier || ''}
            onChange={(val) => handleChange('company_tier', val)}
            placeholder="All Company Tiers"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-nowrap shrink-0">
      {/* 1. Placement Year / Cycle */}
      <SearchableFilterSelect
        className="w-36"
        options={PLACEMENT_YEARS}
        value={filters.placement_year || ''}
        onChange={(val) => handleChange('placement_year', val)}
        placeholder="Placement Cycle"
      />

      {/* 2. Department */}
      <SearchableFilterSelect
        className="w-40"
        options={DEPARTMENTS}
        value={filters.department || ''}
        onChange={(val) => handleChange('department', val)}
        placeholder="Department"
      />

      {/* 3. Offer Type */}
      <SearchableFilterSelect
        className="w-36"
        options={PLACEMENT_OFFER_TYPES}
        value={filters.offer_type || ''}
        onChange={(val) => handleChange('offer_type', val)}
        placeholder="Offer Type"
      />

      {/* 4. Salary Band */}
      <SearchableFilterSelect
        className="w-36"
        options={SALARY_BANDS}
        value={filters.salary_band || ''}
        onChange={(val) => handleChange('salary_band', val)}
        placeholder="Salary Band"
      />

      {/* 5. Company Tier */}
      <SearchableFilterSelect
        className="w-36"
        options={COMPANY_TIERS}
        value={filters.company_tier || ''}
        onChange={(val) => handleChange('company_tier', val)}
        placeholder="Company Tier"
      />
    </div>
  );
}
