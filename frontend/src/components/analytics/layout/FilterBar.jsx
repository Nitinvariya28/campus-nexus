import React, { useState, useMemo } from 'react';
import { Filter, RotateCcw, SlidersHorizontal, X, Check } from 'lucide-react';
import CommonFilters from '../filters/CommonFilters';
import StudentFilters from '../filters/StudentFilters';
import AlumniFilters from '../filters/AlumniFilters';
import PlacementFilters from '../filters/PlacementFilters';

/**
 * FilterBar Component (Zone 3)
 * Modern Enterprise Indigo & Slate Styling.
 * Anchored above the analysis area.
 * Dynamically mounts the appropriate filter cluster based on activeDashboard.
 *
 * Responsive Architecture:
 * - Desktop/Tablet (sm: and up): Sleek single-row inline filters with direct selects.
 * - Mobile (<sm): Interactive "Filter Menu" button triggering a full touch-friendly
 *   bottom sheet/modal drawer with vertical selects, clear labels, and dedicated
 *   "Apply Filters" and "Reset" actions. Eliminates clumsy horizontal scrolling on phones.
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Compute number of non-default active filters applied
  const activeFilterCount = useMemo(() => {
    if (!stagedFilters) return 0;
    return Object.entries(stagedFilters).filter(([key, val]) => {
      if (val === undefined || val === null || val === '') return false;
      if (key === 'range' && (val === '12m' || val === '')) return false;
      return true;
    }).length;
  }, [stagedFilters]);

  // Dashboard title badge text
  const dashboardLabel = useMemo(() => {
    switch (activeDashboard) {
      case 'student':
        return 'Student Cohort';
      case 'alumni':
        return 'Alumni Network';
      case 'placement_cell':
        return 'Placement Cell';
      case 'common':
      default:
        return 'Overview';
    }
  }, [activeDashboard]);

  const renderContextFilters = (layout = 'horizontal') => {
    switch (activeDashboard) {
      case 'student':
        return <StudentFilters filters={stagedFilters} onChange={onFilterChange} layout={layout} />;
      case 'alumni':
        return <AlumniFilters filters={stagedFilters} onChange={onFilterChange} layout={layout} />;
      case 'placement_cell':
        return <PlacementFilters filters={stagedFilters} onChange={onFilterChange} layout={layout} />;
      case 'common':
      default:
        return <CommonFilters filters={stagedFilters} onChange={onFilterChange} layout={layout} />;
    }
  };

  const handleMobileApply = () => {
    setIsMobileDrawerOpen(false);
    if (onApply) onApply();
  };

  return (
    <>
      <div className="shrink-0 min-h-14 bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-0 flex items-center justify-between gap-3 z-30 relative">
        {/* ========================================================= */}
        {/* MOBILE VIEW (<sm): Filter Menu Trigger Button              */}
        {/* ========================================================= */}
        <div className="flex sm:hidden items-center justify-between w-full gap-2">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors active:scale-95 shadow-2xs"
            aria-label="Open Filter Menu"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white min-w-4">
                {activeFilterCount}
              </span>
            )}
          </button>

          <span className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">
            {dashboardLabel}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onApply}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xs transition-all active:scale-[0.98]"
            >
              Apply
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP / TABLET VIEW (sm+): Inline Horizontal Filter Bar  */}
        {/* ========================================================= */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 py-1.5 min-w-0 flex-1 whitespace-nowrap overflow-visible">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Filters:</span>
          </div>
          {renderContextFilters('horizontal')}
        </div>

        {/* Desktop Action Controls */}
        <div className="hidden sm:flex items-center gap-2 shrink-0 pl-2 bg-white">
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors px-2 py-1.5 rounded-md hover:bg-slate-100 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
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

      {/* ========================================================= */}
      {/* MOBILE FILTER MODAL / BOTTOM SHEET (<sm only)              */}
      {/* ========================================================= */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end sm:hidden animate-in fade-in duration-150"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col w-full overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">Filter Analytics</h3>
                    {activeFilterCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        {activeFilterCount} active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {dashboardLabel} Dimensions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                aria-label="Close Filter Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: Vertical Form Controls */}
            <div className="p-5 overflow-y-auto space-y-4">
              {renderContextFilters('vertical')}
            </div>

            {/* Drawer Sticky Footer Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onReset();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>

              <button
                type="button"
                onClick={handleMobileApply}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
