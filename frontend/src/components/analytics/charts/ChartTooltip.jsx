import React from 'react';

/**
 * Standardized Recharts Custom Tooltip Component
 * Elevated white card with border, subtle shadow, and clean numeric formatting.
 */
export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-3 min-w-[140px] text-xs">
      {label && (
        <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="truncate">{entry.name}:</span>
            </span>
            <span className="font-bold text-slate-900 shrink-0">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
