import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

/**
 * EmptyStateCard Component
 * Displayed when filters return zero matching records.
 */
export default function EmptyStateCard({
  title = 'No Data Found',
  message = 'No analytics records matched your active filter criteria. Try adjusting or clearing your filters.',
  onReset,
}) {
  return (
    <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
        <SearchX className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{message}</p>
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}
