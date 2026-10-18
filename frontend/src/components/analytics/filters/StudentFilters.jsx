import React from 'react';
import SearchableFilterSelect from './SearchableFilterSelect';
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
 * 2. Graduation Batch
 * 3. Academic Department
 * 4. Current Semester
 * 5. Placement Status
 * Upgraded with searchable typeahead select dropdowns.
 *
 * @param {object} filters - Active filter states
 * @param {function} onChange - (key, value) => void
 * @param {string} layout - 'horizontal' | 'vertical'
 */
export default function StudentFilters({ filters = {}, onChange, layout = 'horizontal' }) {
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
            Current Semester
          </label>
          <SearchableFilterSelect
            options={STUDENT_SEMESTERS}
            value={filters.semester || ''}
            onChange={(val) => handleChange('semester', val)}
            placeholder="All Semesters"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Placement Status
          </label>
          <SearchableFilterSelect
            options={PLACEMENT_STATUSES}
            value={filters.placed_status || ''}
            onChange={(val) => handleChange('placed_status', val)}
            placeholder="All Placement Statuses"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-nowrap shrink-0">
      {/* 1. Academic Year */}
      <SearchableFilterSelect
        className="w-36"
        options={ACADEMIC_YEARS}
        value={filters.year || ''}
        onChange={(val) => handleChange('year', val)}
        placeholder="Academic Year"
      />

      {/* 2. Graduation Batch */}
      <SearchableFilterSelect
        className="w-36"
        options={GRADUATION_BATCHES}
        value={filters.batch || ''}
        onChange={(val) => handleChange('batch', val)}
        placeholder="Graduation Batch"
      />

      {/* 3. Department */}
      <SearchableFilterSelect
        className="w-40"
        options={DEPARTMENTS}
        value={filters.department || ''}
        onChange={(val) => handleChange('department', val)}
        placeholder="Department"
      />

      {/* 4. Current Semester */}
      <SearchableFilterSelect
        className="w-36"
        options={STUDENT_SEMESTERS}
        value={filters.semester || ''}
        onChange={(val) => handleChange('semester', val)}
        placeholder="Current Semester"
      />

      {/* 5. Placement Status */}
      <SearchableFilterSelect
        className="w-36"
        options={PLACEMENT_STATUSES}
        value={filters.placed_status || ''}
        onChange={(val) => handleChange('placed_status', val)}
        placeholder="Placement Status"
      />
    </div>
  );
}
