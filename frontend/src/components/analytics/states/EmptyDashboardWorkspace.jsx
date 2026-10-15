import React from 'react';
import { BarChart3, SlidersHorizontal } from 'lucide-react';

/**
 * EmptyDashboardWorkspace Component
 * Rendered on each dashboard during this layout & navigation verification phase.
 * Styled in Modern Enterprise Indigo & Slate.
 */
export default function EmptyDashboardWorkspace({
  title,
  subtitle,
  badge = 'Active View',
  icon: Icon = BarChart3,
}) {
  return (
    <div className="space-y-6">
      {/* Dashboard View Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          {subtitle}
        </p>
      </div>

      {/* Clean Empty Analysis Workspace Container */}
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
          <Icon className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Analysis Area Ready
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Navigation, sidebar selection, and contextual filter bar are active. Analytical visualizations, KPI metric cards, and data queues will be mounted here.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
          <span>Contextual filters in the bar above are synchronized with this dashboard</span>
        </div>
      </div>
    </div>
  );
}
