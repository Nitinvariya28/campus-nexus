import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { SEMANTIC_COLORS } from '../../../constants/analytics/chartTheme';

/**
 * Standardized KPI Metric Card
 * Supports standard icon badges, circular radial progress rings (customBadge),
 * and custom metric chips (customFooter) matching the official demo design.
 *
 * @param {string} title - Metric label
 * @param {string|number} [value] - Formatted value
 * @param {string} [deltaText] - Delta text (e.g. "+12.5% vs last year")
 * @param {boolean} [isPositive=true] - Trend direction
 * @param {string} [accentColor='blue'] - Theme token
 * @param {React.ReactNode} [icon] - Standard Lucide icon
 * @param {React.ReactNode} [customBadge] - Custom badge (e.g. circular radial gauge)
 * @param {string} [subtitle] - Subtitle text
 * @param {React.ReactNode} [customFooter] - Custom footer elements (e.g. role breakdown pills)
 */
export default function KPICard({
  title,
  value,
  deltaText,
  isPositive = true,
  accentColor = 'blue',
  icon,
  customBadge,
  subtitle,
  customFooter,
  valueClassName,
}) {
  const colorToken = SEMANTIC_COLORS[accentColor] || SEMANTIC_COLORS.blue;

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between h-full min-w-0 overflow-hidden">
      {/* Header Row: Title & Top-Right Badge/Gauge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate min-w-0 flex-1"
          title={title}
        >
          {title}
        </span>
        {customBadge ? (
          <div className="shrink-0">{customBadge}</div>
        ) : icon ? (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorToken.bg} ${colorToken.text}`}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(icon, { className: 'w-3.5 h-3.5' })
              : icon}
          </div>
        ) : null}
      </div>

      {/* Metric Value Row */}
      {value !== undefined && (
        <div className="my-1.5">
          <div
            className={`font-bold tracking-tight text-slate-900 truncate whitespace-nowrap ${
              valueClassName || 'text-2xl'
            }`}
            title={typeof value === 'number' ? value.toLocaleString() : value}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
        </div>
      )}

      {/* Footer Row: Delta, Subtitle or Custom Breakdown */}
      {customFooter ? (
        <div className="mt-1 pt-1 border-t border-slate-100">{customFooter}</div>
      ) : (
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
      )}
    </div>
  );
}
