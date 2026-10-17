import React, { useState } from 'react';
import Sidebar from './Sidebar';
import FilterBar from './FilterBar';
import Footer from './Footer';
import { DASHBOARDS } from '../../../constants/analytics/dashboardConfig';
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Building2,
  PanelLeft,
} from 'lucide-react';

/**
 * Master DashboardLayout Component
 * Reuses the authentic top Navbar provided by AppLayout (from authentication phase).
 * Eliminates duplicate navbars, eliminates w-screen/horizontal overflow.
 *
 * Layout Structure:
 * - Left: Sidebar with strictly 4 modular dashboards (w-64, #0F172A desktop; slide-out drawer on mobile)
 * - Mobile Header (md:hidden): Quick slide bar toggle + horizontal dashboard switch tabs
 * - Right: Contextual FilterBar at top (h-14, white) + Vertically Scrollable Analysis Area (overflow-y-auto, overflow-x-hidden)
 * - Bottom of analysis stream: Reused in-flow Footer
 *
 * @param {React.ReactNode} children - Analysis content
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const iconMap = {
    LayoutDashboard,
    GraduationCap,
    Briefcase,
    Building2,
  };

  const shortLabels = {
    common: 'Overview',
    student: 'Student Hub',
    alumni: 'Alumni Net',
    placement_cell: 'Placement',
  };

  return (
    <div className="h-full w-full flex min-h-0 overflow-hidden bg-slate-50">
      {/* Sidebar: Handles both Desktop fixed sidebar and Mobile slide drawer */}
      <Sidebar
        activeDashboard={activeDashboard}
        onSelectDashboard={onSelectDashboard}
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Column: Filter Bar + Analysis Area (Scrollable Vertically Only) */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Mobile Dashboard Navigation Header (md:hidden): Slide Bar Toggle + Quick Tabs */}
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shrink-0 z-30 shadow-xs">
          {/* Slide Bar Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 shrink-0 transition-colors shadow-xs"
            title="Open Dashboards Slide Bar"
          >
            <PanelLeft className="w-4 h-4 text-indigo-400" />
            <span>Dashboards</span>
          </button>

          {/* Quick Horizontal Dashboard Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 min-w-0">
            {DASHBOARDS.map((db) => {
              const Icon = iconMap[db.icon] || LayoutDashboard;
              const isActive = activeDashboard === db.id;
              const label = shortLabels[db.id] || db.title;

              return (
                <button
                  key={db.id}
                  type="button"
                  onClick={() => onSelectDashboard && onSelectDashboard(db.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold ring-1 ring-indigo-400/40'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Contextual Filter Bar */}
        <FilterBar
          activeDashboard={activeDashboard}
          stagedFilters={stagedFilters}
          onFilterChange={onFilterChange}
          onApply={onApplyFilters}
          onReset={onResetFilters}
        />

        {/* Dedicated Analysis Area (Scrollable ONLY vertically, NEVER horizontally) */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-6 scroll-smooth bg-slate-50 flex flex-col">
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {children}
            </div>

            {/* In-flow Footer permanently anchored at bottom of stream */}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
