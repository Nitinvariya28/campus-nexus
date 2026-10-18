import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Building2,
  ChevronRight,
  X,
} from 'lucide-react';
import { DASHBOARDS } from '../../../constants/analytics/dashboardConfig';

/**
 * Sidebar Component (Zone 2)
 * Modern Enterprise Indigo & Slate Design.
 * Softer dark slate tone (#0F172A), crisp border separation (border-slate-800/80),
 * and sleeker active tab indicator in Rich Indigo (#4F46E5).
 *
 * Supports both:
 * 1. Desktop static sidebar (md:flex w-60, full h-screen)
 * 2. Mobile slide-out drawer (md:hidden slide-in overlay when isOpen is true)
 *
 * @param {string} activeDashboard - Currently selected dashboard ID ('common' | 'student' | 'alumni' | 'placement_cell')
 * @param {function} onSelectDashboard - Callback to switch dashboard in-place
 * @param {boolean} isOpen - Whether mobile slide drawer is open
 * @param {function} onClose - Callback to close mobile slide drawer
 */
export default function Sidebar({
  activeDashboard = 'common',
  onSelectDashboard,
  isOpen = false,
  onClose,
}) {
  const iconMap = {
    LayoutDashboard,
    GraduationCap,
    Briefcase,
    Building2,
  };

  // Prevent background scroll when mobile drawer is open & handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelect = (id) => {
    if (onSelectDashboard) {
      onSelectDashboard(id);
    }
    if (onClose) {
      onClose();
    }
  };

  const renderDashboardNav = (isMobile = false) => (
    <nav className="space-y-1">
      {DASHBOARDS.map((db) => {
        const Icon = iconMap[db.icon] || LayoutDashboard;
        const isActive = activeDashboard === db.id;

        return (
          <button
            key={db.id}
            type="button"
            onClick={() => handleSelect(db.id)}
            className={`w-full group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 text-left ${
              isActive
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-950/40 ring-1 ring-indigo-400/30 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <div className="truncate">
                <span className="truncate block">{db.title}</span>
                {isMobile && db.subtitle && (
                  <span className={`text-[9px] block truncate ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {db.subtitle}
                  </span>
                )}
              </div>
            </div>

            {isActive && (
              <ChevronRight className="w-3 h-3 text-indigo-200 shrink-0 ml-1.5" />
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar (Zone 2, md:flex) - Full Height with Brand Header */}
      <aside className="w-56 shrink-0 bg-slate-900 text-slate-300 hidden md:flex flex-col justify-start py-4 px-3 border-r border-slate-800/80 h-screen overflow-y-auto scrollbar-none shadow-xs">
        <div>
          {/* Top Platform Brand Header */}
          <div className="flex items-center gap-2.5 px-2.5 pb-4 mb-4 border-b border-slate-800/80">
            <img 
              src="/logo.svg" 
              alt="AlumiBridge Logo" 
              className="w-7 h-7 shrink-0" 
            />
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight text-white block truncate leading-tight">
                Alumi<span className="text-amber-500">Bridge</span>
              </span>
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider block">
                Analytics Intelligence
              </span>
            </div>
          </div>

          {/* Analytics Views Section */}
          <div>
            <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 mb-2">
              Analytics Suite
            </h2>
            {renderDashboardNav(false)}
          </div>
        </div>
      </aside>

      {/* 2. Mobile Slide Bar Drawer (md:hidden) */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
        aria-modal="true"
        role="dialog"
      >
        {/* Backdrop Overlay */}
        <div
          className={`fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Slide-out Drawer Panel */}
        <aside
          className={`fixed inset-y-0 left-0 z-10 w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col justify-between p-5 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } overflow-y-auto`}
        >
          {/* Mobile Drawer Header with Close Button */}
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/logo.svg" 
                  alt="AlumiBridge Logo" 
                  className="w-7 h-7 shrink-0" 
                />
                <div>
                  <h3 className="text-xs font-semibold text-white leading-tight">
                    Alumi<span className="text-amber-500">Bridge</span>
                  </h3>
                  <p className="text-[9px] text-slate-400">Analytics Intelligence</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close analytics navigation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dashboard Selector */}
            <div>
              <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2.5 mb-2">
                Analytics Suite
              </h2>
              {renderDashboardNav(true)}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
