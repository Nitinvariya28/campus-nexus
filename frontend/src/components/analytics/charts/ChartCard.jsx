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
  heightClass = 'h-60',
}) {
  return (
    <div
      className={`bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-full min-w-0 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>}
        </div>
        {actionSlot && <div className="text-xs shrink-0 self-start sm:self-auto">{actionSlot}</div>}
      </div>

      <div className={`w-full flex-1 min-h-0 ${heightClass}`}>
        {children}
      </div>
    </div>
  );
}
