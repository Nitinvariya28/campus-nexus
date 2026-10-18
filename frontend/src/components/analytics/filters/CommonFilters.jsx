import React from 'react';
import SearchableFilterSelect from './SearchableFilterSelect';
import {
  ACADEMIC_YEARS,
  DEPARTMENTS,
  GRADUATION_BATCHES,
  DATE_RANGES,
} from '../../../constants/analytics/filterOptions';

/**
 * Common / Overview Dashboard Contextual Filters
 * Fields: Academic Year, Department, Graduation Batch, Date Range
 * Upgraded with searchable typeahead select dropdowns.
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
          <SearchableFilterSelect
            options={ACADEMIC_YEARS}
            value={filters.year || ''}
            onChange={(val) => handleChange('year', val)}
            placeholder="All Academic Years"
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
            Date Range
          </label>
          <SearchableFilterSelect
            options={DATE_RANGES}
            value={filters.range || '12m'}
            onChange={(val) => handleChange('range', val)}
            placeholder="Date Range"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-nowrap shrink-0">
      {/* Academic Year */}
      <SearchableFilterSelect
        className="w-36"
        options={ACADEMIC_YEARS}
        value={filters.year || ''}
        onChange={(val) => handleChange('year', val)}
        placeholder="Academic Year"
      />

      {/* Department */}
      <SearchableFilterSelect
        className="w-40"
        options={DEPARTMENTS}
        value={filters.department || ''}
        onChange={(val) => handleChange('department', val)}
        placeholder="Department"
      />

      {/* Graduation Batch */}
      <SearchableFilterSelect
        className="w-36"
        options={GRADUATION_BATCHES}
        value={filters.batch || ''}
        onChange={(val) => handleChange('batch', val)}
        placeholder="Graduation Batch"
      />

      {/* Date Range */}
      <SearchableFilterSelect
        className="w-32"
        options={DATE_RANGES}
        value={filters.range || '12m'}
        onChange={(val) => handleChange('range', val)}
        placeholder="Date Range"
      />
    </div>
  );
}
