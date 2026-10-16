import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Building2,
  User,
  Settings,
  HelpCircle,
  ChevronRight,
  X,
  Layers,
} from 'lucide-react';
import { DASHBOARDS } from '../../../constants/analytics/dashboardConfig';

/**
 * Sidebar Component (Zone 2)
 * Modern Enterprise Indigo & Slate Design.
 * Softer dark slate tone (#0F172A), crisp border separation (border-slate-800/80),
 * and sleeker active tab indicator in Rich Indigo (#4F46E5).
 *
 * Supports both:
 * 1. Desktop static sidebar (md:flex w-64)
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

  const quickLinks = [
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Help & Support', path: '/support', icon: HelpCircle },
  ];

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
    <nav className="space-y-1.5">
      {DASHBOARDS.map((db) => {
        const Icon = iconMap[db.icon] || LayoutDashboard;
        const isActive = activeDashboard === db.id;

        return (
          <button
            key={db.id}
            type="button"
            onClick={() => handleSelect(db.id)}
            className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 text-left ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40 ring-1 ring-indigo-400/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <div className="truncate">
                <span className="truncate block font-medium">{db.title}</span>
                {isMobile && db.subtitle && (
                  <span className={`text-[10px] block truncate ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {db.subtitle}
                  </span>
                )}
              </div>
            </div>

            {isActive && (
              <ChevronRight className="w-3.5 h-3.5 text-indigo-200 shrink-0 ml-2" />
            )}
          </button>
        );
      })}
    </nav>
  );

  const renderQuickLinks = () => (
    <nav className="space-y-0.5">
      {quickLinks.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.label}
            href={item.path}
            onClick={() => onClose && onClose()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. Desktop Static Sidebar (Zone 2, md:flex) */}
      <aside className="w-64 shrink-0 bg-slate-900 text-slate-300 hidden md:flex flex-col justify-between py-6 px-3.5 border-r border-slate-800/80 h-full overflow-y-auto scrollbar-none shadow-xs">
        {/* Top Group: Strictly Four Thematic Dashboards */}
        <div className="space-y-6">
          <div>
            <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
              Dashboards
            </h2>
            {renderDashboardNav(false)}
          </div>
        </div>

        {/* Bottom Group: Quick Links with Subtle Border Separation */}
        <div>
          <div className="border-t border-slate-800/80 pt-4 mb-1">
            <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Quick Links
            </h2>
            {renderQuickLinks()}
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
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white leading-tight">
                    Analytics Suite
                  </h3>
                  <p className="text-[10px] text-slate-400">Select dashboard view</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close dashboard slide bar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dashboard Selector */}
            <div>
              <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
                Dashboards
              </h2>
              {renderDashboardNav(true)}
            </div>
          </div>

          {/* Quick Links at Bottom of Drawer */}
          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Quick Links
            </h2>
            {renderQuickLinks()}
          </div>
        </aside>
      </div>
    </>
  );
}
