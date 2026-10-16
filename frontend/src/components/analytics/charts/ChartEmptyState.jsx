import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * ChartEmptyState Component
 * Standardized empty/unavailable feedback rendered inside ChartCard
 * when the API returns no records or encounters a technical issue for a visualization.
 *
 * @param {string} [title="Data Not Available"] - Heading
 * @param {string} [message="Technical issue: data not available for this visualization."] - Descriptive helper
 */
export default function ChartEmptyState({
  title = 'Data Not Available',
  message = 'Technical issue: data not available for this visualization.',
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
        <AlertCircle className="w-4 h-4 text-slate-500" />
      </div>
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
}
