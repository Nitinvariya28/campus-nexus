import React from 'react';
import SearchableFilterSelect from './SearchableFilterSelect';
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
 * Upgraded with searchable typeahead select dropdowns.
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
          <SearchableFilterSelect
            options={GRADUATION_BATCHES}
            value={filters.batch || ''}
            onChange={(val) => handleChange('batch', val)}
            placeholder="All Graduation Batches"
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
            Job Category
          </label>
          <SearchableFilterSelect
            options={ALUMNI_JOB_CATEGORIES}
            value={filters.job_category || ''}
            onChange={(val) => handleChange('job_category', val)}
            placeholder="All Job Categories"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Industry Sector
          </label>
          <SearchableFilterSelect
            options={ALUMNI_INDUSTRIES}
            value={filters.industry || ''}
            onChange={(val) => handleChange('industry', val)}
            placeholder="All Industry Sectors"
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
      {/* 1. Graduation Batch */}
      <SearchableFilterSelect
        className="w-36"
        options={GRADUATION_BATCHES}
        value={filters.batch || ''}
        onChange={(val) => handleChange('batch', val)}
        placeholder="Graduation Batch"
      />

      {/* 2. Department */}
      <SearchableFilterSelect
        className="w-40"
        options={DEPARTMENTS}
        value={filters.department || ''}
        onChange={(val) => handleChange('department', val)}
        placeholder="Department"
      />

      {/* 3. Job Category */}
      <SearchableFilterSelect
        className="w-36"
        options={ALUMNI_JOB_CATEGORIES}
        value={filters.job_category || ''}
        onChange={(val) => handleChange('job_category', val)}
        placeholder="Job Category"
      />

      {/* 4. Industry Sector */}
      <SearchableFilterSelect
        className="w-36"
        options={ALUMNI_INDUSTRIES}
        value={filters.industry || ''}
        onChange={(val) => handleChange('industry', val)}
        placeholder="Industry Sector"
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
