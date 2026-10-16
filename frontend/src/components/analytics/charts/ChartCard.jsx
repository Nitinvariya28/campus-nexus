import React from 'react';

/**
 * Standard Chart Wrapper Card
 * Wraps Recharts components with a clean white card, title, subtitle, and action dropdown slot.
 *
 * @param {string} title - Chart title
 * @param {string} [subtitle] - Secondary helper description
 * @param {React.ReactNode} [actionSlot] - Optional timeframe selector or count dropdown
 * @param {React.ReactNode} children - Recharts visualization
 * @param {string} [className] - Additional Tailwind classes
 * @param {string} [heightClass="h-72"] - Chart container height class
 */
export default function ChartCard({
  title,
  subtitle,
  actionSlot,
  children,
  className = '',
  heightClass = 'h-72',
}) {
  return (
    <div
      className={`bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
        {actionSlot && <div className="text-xs shrink-0 self-start sm:self-auto">{actionSlot}</div>}
      </div>

      <div className={`w-full ${heightClass}`}>
        {children}
      </div>
    </div>
  );
}
