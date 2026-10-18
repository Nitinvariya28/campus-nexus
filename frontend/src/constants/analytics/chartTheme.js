/**
 * Recharts & UI Design System Tokens for Analytics
 * Modern Enterprise Indigo & Slate Palette
 */

export const CHART_PALETTE = {
  // Primary Categorical Sequence (Donuts, Multi-line, Clustered Bars)
  primary: [
    '#4F46E5', // 1. Rich Indigo (Primary active series / Placements / Main)
    '#059669', // 2. Emerald Green (Success / Verified / Placed)
    '#D97706', // 3. Warm Amber (Moderate / Offers / Mid-tier)
    '#7C3AED', // 4. Royal Violet (Alumni / Super Dream / Specialized)
    '#0284C7', // 5. Clean Sky Blue (Technical skills / Campus drives)
    '#E11D48', // 6. Modern Rose (Secondary cohort alerts)
    '#64748B', // 7. Slate Gray (Other / Uncategorized)
  ],

  // Salary Package Tier Gradients (Discrete Column Bars)
  salaryBands: {
    entry: '#A5B4FC',     // < 3.0 LPA (Light Indigo/Periwinkle)
    mass: '#6366F1',      // 3.0 - 5.0 LPA (Indigo)
    core: '#0D9488',      // 5.0 - 8.0 LPA (Teal)
    dream: '#7C3AED',     // 8.0 - 12.0 LPA (Purple)
    superDream: '#D97706', // 12.0 - 20.0 LPA (Deep Amber)
    peak: '#B45309',      // > 20.0 LPA (Gold Accent)
  },

  // Grid & Axis Styling
  grid: '#E2E8F0',        // 1px dashed grid line
  axisText: '#64748B',    // 11px medium slate text
  tooltipBg: '#FFFFFF',   // Pure white card
  tooltipBorder: '#CBD5E1', // Slate 300
};

export const SEMANTIC_COLORS = {
  indigo: {
    text: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    hex: '#4F46E5',
  },
  emerald: {
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    hex: '#059669',
  },
  blue: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    hex: '#2563EB',
  },
  amber: {
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    hex: '#D97706',
  },
  rose: {
    text: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    hex: '#E11D48',
  },
  purple: {
    text: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    hex: '#7C3AED',
  },
};

/**
 * Standardized Chart Dimensions & Styling Across All 4 Dashboards
 * Strictly enforces identical inside width, bar thickness, radii, and typography.
 */
export const CHART_DIMENSIONS = {
  barSize: 18,
  maxBarSize: 22,
  barRadiusVertical: [4, 4, 0, 0],
  barRadiusHorizontal: [0, 4, 4, 0],
  donutInnerRadius: 55,
  donutOuterRadius: 80,
  strokeWidth: 2,
  axisTick: { fontSize: 11, fill: '#64748B' },
  gridStroke: '#E2E8F0',
  gridDashArray: '3 3',
  tooltipStyle: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderRadius: '8px',
    color: '#F8FAFC',
    fontSize: '11px',
    padding: '6px 10px',
  },
};

