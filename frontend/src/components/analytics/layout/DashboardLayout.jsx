import React from 'react';
import Sidebar from './Sidebar';
import FilterBar from './FilterBar';
import Footer from './Footer';

/**
 * Master DashboardLayout Component
 * Reuses the authentic top Navbar provided by AppLayout (from authentication phase).
 * Eliminates duplicate navbars, eliminates w-screen/horizontal overflow.
 *
 * Layout Structure:
 * - Left: Sidebar with strictly 4 modular dashboards (w-64, #0F172A)
 * - Right: Contextual FilterBar at top (h-14, white) + Vertically Scrollable Analysis Area (overflow-y-auto, overflow-x-hidden)
 * - Bottom of analysis stream: Reused in-flow Footer
 *
 * @param {React.ReactNode} children - Analysis content (Currently empty placeholder view)
 * @param {string} activeDashboard - 'common' | 'student' | 'alumni' | 'placement_cell'
 * @param {function} onSelectDashboard - (dashboardId) => void
 * @param {object} stagedFilters - Current filter values in filter bar
 * @param {function} onFilterChange - (key, value) => void
 * @param {function} onApplyFilters - Trigger filter apply
 * @param {function} onResetFilters - Reset filters
 */
export default function DashboardLayout({
  children,
  activeDashboard = 'common',
  onSelectDashboard,
  stagedFilters = {},
  onFilterChange,
  onApplyFilters,
  onResetFilters,
}) {
  return (
    <div className="h-full w-full flex min-h-0 overflow-hidden bg-slate-50">
      {/* Left: Sidebar (Strictly 4 Dashboards, Deep Navy #0F172A) */}
      <Sidebar
        activeDashboard={activeDashboard}
        onSelectDashboard={onSelectDashboard}
      />

      {/* Right Column: Filter Bar + Analysis Area (Scrollable Vertically Only) */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Dynamic Contextual Filter Bar */}
        <FilterBar
          activeDashboard={activeDashboard}
          stagedFilters={stagedFilters}
          onFilterChange={onFilterChange}
          onApply={onApplyFilters}
          onReset={onResetFilters}
        />

        {/* Dedicated Analysis Area (Scrollable ONLY vertically, NEVER horizontally) */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 scroll-smooth bg-slate-50">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            {children}

            {/* In-flow Footer at bottom of scrollable analysis content */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
