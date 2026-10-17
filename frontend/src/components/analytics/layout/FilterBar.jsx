import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import CommonFilters from '../filters/CommonFilters';
import StudentFilters from '../filters/StudentFilters';
import AlumniFilters from '../filters/AlumniFilters';
import PlacementFilters from '../filters/PlacementFilters';

/**
 * FilterBar Component (Zone 3)
 * Modern Enterprise Indigo & Slate Styling.
 * Anchored above the analysis area (min-h-14, white surface, border-b border-slate-200).
 * Dynamically mounts the appropriate filter cluster based on activeDashboard.
 * Strictly prevents page-level horizontal overflow.
 *
 * @param {string} activeDashboard - 'common' | 'student' | 'alumni' | 'placement_cell'
 * @param {object} stagedFilters - Staged filter values
 * @param {function} onFilterChange - (key, value) => void
 * @param {function} onApply - Trigger API re-hydration with staged filters
 * @param {function} onReset - Reset filters to defaults
 */
export default function FilterBar({
  activeDashboard = 'common',
  stagedFilters = {},
  onFilterChange,
  onApply,
  onReset,
}) {
  const renderContextFilters = () => {
    switch (activeDashboard) {
      case 'student':
        return <StudentFilters filters={stagedFilters} onChange={onFilterChange} />;
      case 'alumni':
        return <AlumniFilters filters={stagedFilters} onChange={onFilterChange} />;
      case 'placement_cell':
        return <PlacementFilters filters={stagedFilters} onChange={onFilterChange} />;
      case 'common':
      default:
        return <CommonFilters filters={stagedFilters} onChange={onFilterChange} />;
    }
  };

  return (
    <div className="shrink-0 min-h-14 bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-0 flex items-center justify-between gap-3 z-20">
      {/* Left: Dynamic Contextual Filters with smooth horizontal scroll */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1.5 scrollbar-none min-w-0 flex-1 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
          <Filter className="w-3.5 h-3.5 text-indigo-600" />
          <span>Filters:</span>
        </div>
        {renderContextFilters()}
      </div>

      {/* Right: Apply & Reset Action Controls */}
      <div className="flex items-center gap-2 shrink-0 pl-2 bg-white border-l border-slate-100 sm:border-l-0">
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100 shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={onApply}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-all active:scale-[0.98] shrink-0"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
