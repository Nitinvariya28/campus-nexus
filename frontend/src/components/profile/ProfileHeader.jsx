import React from 'react';
import { UserCog, User, FileText, Shield, LogOut } from 'lucide-react';

/**
 * ProfileHeader Component
 * Clean page header showing title, logout action, and segmented tab options.
 * (Description omitted per UI requirements - only title, action, and tab options).
 */
export default function ProfileHeader({ activeTab, onTabChange, userRole, onLogout }) {
  const tabs = [
    { id: 'details', label: 'Profile Details', icon: User, showFor: ['STUDENT', 'ALUMNI', 'PLACEMENT_CELL'] },
    { id: 'resumes', label: 'Resumes & CV', icon: FileText, showFor: ['STUDENT', 'ALUMNI'] },
    { id: 'security', label: 'Security & Account', icon: Shield, showFor: ['STUDENT', 'ALUMNI', 'PLACEMENT_CELL'] },
  ];

  // Filter tabs based on role capability
  const visibleTabs = tabs.filter(tab => !userRole || tab.showFor.includes(userRole));

  return (
    <div className="space-y-4">
      {/* Title & Top Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600 shadow-2xs">
            <UserCog className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Account Settings & Profile Management
          </h1>
        </div>

        {/* Global Logout Action */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200/80 transition shadow-2xs shrink-0"
            title="Log out of your active session"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        )}
      </div>

      {/* Segmented Tab Options Bar */}
      <div className="flex items-center space-x-1.5 border-b border-slate-200/90 pb-2 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
