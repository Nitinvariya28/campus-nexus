import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SEMANTIC_COLORS } from '../../../constants/analytics/chartTheme';

/**
 * Standardized KPI Metric Card
 * Strictly follows typography and color tokens from ANALYTICS_UI_THEME_AND_CHART_DESIGN_SYSTEM.md.
 *
 * @param {string} title - Uppercase metric label (e.g. "Total Students")
 * @param {string|number} value - Big bold formatted value (e.g. "1,024" or "₹ 12.8 LPA")
 * @param {string} [deltaText] - Delta text (e.g. "12% vs last year")
 * @param {boolean} [isPositive=true] - Positive (green) vs negative (red) trend
 * @param {string} [accentColor='blue'] - 'emerald' | 'blue' | 'amber' | 'rose' | 'purple'
 * @param {React.ReactNode} [icon] - Lucide icon element
 * @param {string} [subtitle] - Optional subtitle (e.g. "Target: > 95%")
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
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
      <div className="space-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block truncate">
          {title}
        </span>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>

        {deltaText && (
          <div
            className={`text-[11px] font-semibold flex items-center gap-1 ${
              isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{deltaText}</span>
          </div>
        )}

        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorToken.bg} ${colorToken.text}`}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
