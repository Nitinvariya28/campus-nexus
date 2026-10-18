import React from 'react';
import { Inbox, RefreshCw } from 'lucide-react';

/**
 * EmptyStateMessage Component
 * Standard empty state display when no feed items match active criteria.
 */
export default function EmptyStateMessage({
  title = 'No Posts Found',
  message = 'There are no community updates or posts matching your current filter selection.',
  onReset,
  resetLabel = 'Show All Posts',
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-10 text-center shadow-2xs space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
        <Inbox className="w-7 h-7" />
      </div>

      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
      </div>

      {onReset && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{resetLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
