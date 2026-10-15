import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SEMANTIC_COLORS } from '../../../constants/analytics/chartTheme';

/**
 * Standardized KPI Metric Card
 * Strictly follows typography and color tokens from ANALYTICS_UI_THEME_AND_CHART_DESIGN_SYSTEM.md.
 * Modern top-right icon badge layout with full-width value rail and zero overflow.
 *
 * @param {string} title - Uppercase metric label (e.g. "Total Registered Users")
 * @param {string|number} value - Formatted value (e.g. "508" or "₹ 11.1 LPA")
 * @param {string} [deltaText] - Delta text (e.g. "+8.4% vs last cycle")
 * @param {boolean} [isPositive=true] - Positive (green) vs negative (rose) trend
 * @param {string} [accentColor='blue'] - 'indigo' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose'
 * @param {React.ReactNode} [icon] - Lucide icon element
 * @param {string} [subtitle] - Subtitle text (e.g. "Students, Alumni & Staff")
 */
export default function KPICard({
  title,
  value,
  deltaText,
  isPositive = true,
  accentColor = 'blue',
  icon,
  subtitle,
}) {
  const colorToken = SEMANTIC_COLORS[accentColor] || SEMANTIC_COLORS.blue;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between h-full min-w-0 overflow-hidden">
      {/* Header Row: Title & Top-Right Compact Icon Badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate min-w-0 flex-1"
          title={title}
        >
          {title}
        </span>
        {icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorToken.bg} ${colorToken.text}`}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(icon, { className: 'w-4 h-4' })
              : icon}
          </div>
        )}
      </div>

      {/* Metric Value Row (Full-width, never wraps) */}
      <div className="my-2">
        <div
          className="text-2xl font-bold tracking-tight text-slate-900 truncate whitespace-nowrap"
          title={typeof value === 'number' ? value.toLocaleString() : value}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>

      {/* Footer Row: Trend Delta & Subtitle */}
      <div className="space-y-0.5 min-w-0">
        {deltaText && (
          <div
            className={`text-[11px] font-semibold flex items-center gap-1 ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            } truncate`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 shrink-0" />
            ) : (
              <TrendingDown className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">{deltaText}</span>
          </div>
        )}

        {subtitle && (
          <p className="text-[11px] text-slate-400 truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
