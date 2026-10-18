import React from 'react';

/**
 * FeedSkeletonCard Component
 * Loading state skeleton for polymorphic feed items.
 * Adheres to COMMUNITY_UI_THEME_AND_DESIGN_SYSTEM.md geometry and pulse animations.
 */
export default function FeedSkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs animate-pulse space-y-4">
      {/* Author Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-slate-200 rounded-md" />
            <div className="h-2.5 w-24 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
      </div>

      {/* Title & Body */}
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
        <div className="h-3 w-full bg-slate-100 rounded-md" />
        <div className="h-3 w-5/6 bg-slate-100 rounded-md" />
      </div>

      {/* Tags / Pills Placeholder */}
      <div className="flex items-center gap-2 pt-1">
        <div className="h-5 w-14 bg-slate-100 rounded-md" />
        <div className="h-5 w-16 bg-slate-100 rounded-md" />
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-4 w-12 bg-slate-200 rounded-md" />
          <div className="h-4 w-16 bg-slate-200 rounded-md" />
        </div>
        <div className="h-4 w-8 bg-slate-200 rounded-md" />
      </div>
    </div>
  );
}
