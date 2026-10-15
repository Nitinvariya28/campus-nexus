import React from 'react';

/**
 * LoadingSkeleton Component
 * Renders pulse shimmer cards matching the exact layout of the active dashboard's KPI grid and charts.
 */
export default function LoadingSkeleton({ kpiCount = 4 }) {
  const kpiPlaceholders = Array.from({ length: kpiCount });

  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards Shimmer Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpiPlaceholders.map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-24 bg-slate-200 rounded" />
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Primary Charts Shimmer Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-72 space-y-4">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-48 w-full bg-slate-100 rounded-lg" />
        </div>
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-72 space-y-4">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-48 w-full bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
