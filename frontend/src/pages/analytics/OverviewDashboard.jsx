import React from 'react';
import { LayoutDashboard, RefreshCw, AlertCircle } from 'lucide-react';
import { useAnalyticsData } from '../../hooks/analytics/useAnalyticsData';
import OverviewKPIGrid from '../../components/analytics/kpi/OverviewKPIGrid';

/**
 * OverviewDashboard View Component (View 1)
 * Displays the Overview Dashboard with live 6 Executive KPI metric cards and contextual filters.
 *
 * @param {object} filters - Active applied filters from FilterBar
 */
export default function OverviewDashboard({ filters = {} }) {
  const { data, loading, error, refetch } = useAnalyticsData('common', filters);

  return (
    <div className="space-y-6">
      {/* Dashboard Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Campus Overview
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Macro-level institutional census, overarching placement benchmarks, and partner footprint.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Updating...
            </span>
          )}
          {!loading && !error && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Campus Data
            </span>
          )}
        </div>
      </div>

      {/* Error Feedback Banner (if API error occurs) */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Unable to load live analytics data: {error}</span>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-200 rounded-md font-semibold text-rose-800 transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Row 1: Executive 6 Master KPI Counter Cards */}
      <section aria-label="Executive KPI Metrics">
        <OverviewKPIGrid data={data?.data || data} loading={loading} filters={filters} />
      </section>

      {/* Subparts Preview Notice (Next Step) */}
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Visualizations & Analysis Section
        </p>
        <p className="text-xs text-slate-400 mt-1">
          The 6 executive KPIs above are live and responsive to the filter bar. Visualizations (Donut, Area, and Column Charts) will be integrated in the upcoming subpart.
        </p>
      </div>
    </div>
  );
}
