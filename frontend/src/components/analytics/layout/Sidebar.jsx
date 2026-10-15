import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Building2,
  User,
  Settings,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { DASHBOARDS } from '../../../constants/analytics/dashboardConfig';

/**
 * Sidebar Component (Zone 2)
 * Modern Enterprise Indigo & Slate Design.
 * Softer dark slate tone (#0F172A), crisp border separation (border-slate-800/80),
 * and sleeker active tab indicator in Rich Indigo (#4F46E5).
 *
 * @param {string} activeDashboard - Currently selected dashboard ID ('common' | 'student' | 'alumni' | 'placement_cell')
 * @param {function} onSelectDashboard - Callback to switch dashboard in-place
 */
export default function Sidebar({ activeDashboard = 'common', onSelectDashboard }) {
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

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-300 hidden md:flex flex-col justify-between py-6 px-3.5 border-r border-slate-800/80 h-full overflow-y-auto scrollbar-none shadow-xs">
      {/* Top Group: Exactly Four Thematic Dashboards */}
      <div className="space-y-6">
        <div>
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
            Dashboards
          </h2>
          <nav className="space-y-1">
            {DASHBOARDS.map((db) => {
              const Icon = iconMap[db.icon] || LayoutDashboard;
              const isActive = activeDashboard === db.id;

              return (
                <button
                  key={db.id}
                  type="button"
                  onClick={() => onSelectDashboard && onSelectDashboard(db.id)}
                  className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40 ring-1 ring-indigo-400/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span className="truncate">{db.title}</span>
                  </div>

                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Group: Quick Links with Subtle Border Separation */}
      <div>
        <div className="border-t border-slate-800/80 pt-4 mb-1">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Quick Links
          </h2>
          <nav className="space-y-0.5">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
