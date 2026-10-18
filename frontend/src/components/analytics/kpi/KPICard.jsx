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
    <div className="bg-white px-2.5 py-2 rounded-lg border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center gap-2.5 h-full min-w-0 overflow-hidden">
      {/* Left: Icon Badge or Circular Gauge */}
      {customBadge ? (
        <div className="shrink-0">{customBadge}</div>
      ) : icon ? (
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${colorToken.bg} ${colorToken.text}`}
        >
          {React.isValidElement(icon)
            ? React.cloneElement(icon, { className: 'w-3.5 h-3.5' })
            : typeof icon === 'function' || (typeof icon === 'object' && icon !== null && icon.$$typeof)
            ? React.createElement(icon, { className: 'w-3.5 h-3.5' })
            : null}
        </div>
      ) : null}

      {/* Right: Metric Label & Primary Value */}
      <div className="min-w-0 flex-1">
        <span
          className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate leading-tight"
          title={title}
        >
          {title}
        </span>
        {value !== undefined && (
          <div className="mt-0.5 flex items-baseline gap-1.5 min-w-0">
            <span
              className={`font-bold tracking-tight text-slate-900 truncate whitespace-nowrap leading-none ${
                valueClassName || 'text-xs sm:text-sm'
              }`}
              title={typeof value === 'number' ? value.toLocaleString() : value}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {deltaText && (
              <span
                className={`text-[9px] font-semibold flex items-center gap-0.5 ${
                  isPositive ? 'text-emerald-600' : 'text-rose-600'
                } truncate shrink-0`}
              >
                {isPositive ? (
                  <TrendingUp className="w-2 h-2 shrink-0" />
                ) : (
                  <TrendingDown className="w-2 h-2 shrink-0" />
                )}
                <span>{deltaText}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
