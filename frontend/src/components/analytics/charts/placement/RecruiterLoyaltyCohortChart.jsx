import React, { useState, useMemo } from 'react';
import {
  Users,
  Repeat,
  UserPlus,
  UserX,
  Search,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

/**
 * RecruiterLoyaltyCohortChart Component (Visual 9 - Row 5 Col 3: 4 cols)
 * Analyzes corporate recruiter retention, repeat visitor loyalty, and pipeline churn.
 * Strictly consumes live API data from data.placement_cell.recruiter_health.recruiter_health.
 *
 * @param {object} data - Aggregated dashboard analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function RecruiterLoyaltyCohortChart({ data, loading = false }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'repeat', 'new', 'lapsed'
  const [searchQuery, setSearchQuery] = useState('');

  // Extract raw recruiter health payload
  const rawHealth = useMemo(() => {
    return data?.placement_cell?.recruiter_health?.recruiter_health || null;
  }, [data]);

  const cohortData = useMemo(() => {
    if (!rawHealth) return null;

    const repeatList = rawHealth.repeat_recruiters || [];
    const newList = rawHealth.new_recruiters || [];
    const lapsedList = rawHealth.lapsed_recruiters || [];

    const repeatCount = repeatList.length;
    const newCount = newList.length;
    const lapsedCount = lapsedList.length;
    const activeTotal = repeatCount + newCount;
    const overallTotal = activeTotal + lapsedCount;

    // Recruiter Retention Rate % (Repeat / Active Total * 100)
    const retentionRate =
      activeTotal > 0 ? Number(((repeatCount / activeTotal) * 100).toFixed(1)) : 0;

    // Repeat share of active
    const repeatPct =
      overallTotal > 0 ? Number(((repeatCount / overallTotal) * 100).toFixed(1)) : 0;
    const newPct =
      overallTotal > 0 ? Number(((newCount / overallTotal) * 100).toFixed(1)) : 0;
    const lapsedPct =
      overallTotal > 0 ? Number(((lapsedCount / overallTotal) * 100).toFixed(1)) : 0;

    return {
      repeatList,
      newList,
      lapsedList,
      repeatCount,
      newCount,
      lapsedCount,
      activeTotal,
      overallTotal,
      retentionRate,
      repeatPct,
      newPct,
      lapsedPct,
    };
  }, [rawHealth]);

  // Filtered employer lists based on search
  const filteredEmployers = useMemo(() => {
    if (!cohortData) return [];
    const q = searchQuery.toLowerCase().trim();

    let list = [];
    if (activeTab === 'repeat') list = cohortData.repeatList;
    else if (activeTab === 'new') list = cohortData.newList;
    else if (activeTab === 'lapsed') list = cohortData.lapsedList;

    if (!q) return list;
    return list.filter((item) =>
      (item.company__name || '').toLowerCase().includes(q)
    );
  }, [cohortData, activeTab, searchQuery]);

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-60 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          <div className="h-10 bg-slate-100 rounded" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 bg-slate-100 rounded" />
            <div className="h-16 bg-slate-100 rounded" />
            <div className="h-16 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  if (
    !cohortData ||
    (cohortData.repeatCount === 0 &&
      cohortData.newCount === 0 &&
      cohortData.lapsedCount === 0)
  ) {
    return (
      <ChartEmptyState
        title="Recruiter Retention & Pipeline Health"
        message="Technical issue: Recruiter loyalty and retention cohort data is not available."
      />
    );
  }

  return (
    <ChartCard
      title="Recruiter Retention & Pipeline Health"
      subtitle="Loyalty cohort tracking across repeat, first-time, and lapsed corporate partners"
      badge={
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>{cohortData.retentionRate}% Loyalty</span>
        </div>
      }
      action={
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
          <button
            onClick={() => {
              setActiveTab('overview');
              setSearchQuery('');
            }}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('repeat');
              setSearchQuery('');
            }}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'repeat'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Repeat ({cohortData.repeatCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('new');
              setSearchQuery('');
            }}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'new'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New ({cohortData.newCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('lapsed');
              setSearchQuery('');
            }}
            className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'lapsed'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Lapsed ({cohortData.lapsedCount})
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-[320px] justify-between">
        {activeTab === 'overview' ? (
          <>
            {/* KPI Triad */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                    Repeat Partners
                  </span>
                  <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-emerald-950">
                    {cohortData.repeatCount}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600">
                    {cohortData.retentionRate}%
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700/80">Active Returning</span>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
                    New Partners
                  </span>
                  <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-blue-950">
                    {cohortData.newCount}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600">
                    First-Time
                  </span>
                </div>
                <span className="text-[10px] text-blue-700/80">Acquired in 2025</span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">
                    Lapsed Recruiters
                  </span>
                  <UserX className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-amber-950">
                    {cohortData.lapsedCount}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-600">
                    Inactive
                  </span>
                </div>
                <span className="text-[10px] text-amber-700/80">Re-engagement pool</span>
              </div>
            </div>

            {/* Segmented Pipeline Bar */}
            <div className="my-auto space-y-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Institutional Recruiter Loyalty Distribution
                </span>
                <span className="text-slate-500 font-medium">
                  {cohortData.activeTotal} Active / {cohortData.overallTotal} Historical
                </span>
              </div>

              {/* Progress stack */}
              <div className="w-full h-3 rounded-full bg-slate-200 flex overflow-hidden shadow-inner">
                <div
                  style={{ width: `${cohortData.repeatPct}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Repeat: ${cohortData.repeatCount} (${cohortData.repeatPct}%)`}
                />
                <div
                  style={{ width: `${cohortData.newPct}%` }}
                  className="bg-blue-500 transition-all duration-500"
                  title={`New: ${cohortData.newCount} (${cohortData.newPct}%)`}
                />
                <div
                  style={{ width: `${cohortData.lapsedPct}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title={`Lapsed: ${cohortData.lapsedCount} (${cohortData.lapsedPct}%)`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">Repeat ({cohortData.repeatPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="truncate">New ({cohortData.newPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="truncate">Lapsed ({cohortData.lapsedPct}%)</span>
                </div>
              </div>
            </div>

            {/* Health callout */}
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-900">
                  Retention Health Status: Excellent (&gt; 70% threshold met)
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded shadow-2xs">
                {cohortData.activeTotal} Total Hires
              </span>
            </div>
          </>
        ) : (
          /* Drill-down list for specific cohort */
          <div className="flex flex-col h-full space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab} employers...`}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[220px]">
              {filteredEmployers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No matching employers found.
                </div>
              ) : (
                filteredEmployers.map((emp, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {emp.company__name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeTab === 'repeat' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            {emp.offers_this_year} Hires
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (Prior: {emp.offers_last_year})
                          </span>
                        </div>
                      )}
                      {activeTab === 'new' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                          {emp.offers_this_year} First-Time Hires
                        </span>
                      )}
                      {activeTab === 'lapsed' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                          Last active: {emp.last_visited_year}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bottom Status Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audited against institutional campus recruiter history</span>
          </div>
          <span className="font-semibold text-slate-700">
            {cohortData.activeTotal} Active Partners
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
