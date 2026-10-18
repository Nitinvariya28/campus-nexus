import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Briefcase, Building2, TrendingUp, Layers } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const SECTOR_COLORS = {
  Finance: '#10B981', // Emerald
  IT: '#6366F1', // Indigo
  Consulting: '#F59E0B', // Amber
  Healthcare: '#EC4899', // Rose/Pink
  Education: '#8B5CF6', // Purple
  Manufacturing: '#06B6D4', // Cyan
  Retail: '#3B82F6', // Blue
  Other: '#64748B', // Slate
};

/**
 * HiringIndustrySectorShareChart Component (Visual 8 - Row 5 Col 2: 4 cols)
 * Analyzes offer volume and candidate absorption distribution across economic sectors.
 * Strictly consumes live API data from data.placement_cell.recruiter_health.yearly_trends.by_industry.
 *
 * @param {object} data - Aggregated dashboard analytics payload
 * @param {boolean} loading - Loading indicator
 */
export default function HiringIndustrySectorShareChart({ data, loading = false }) {
  const [selectedYear, setSelectedYear] = useState('All');
  const [metricMode, setMetricMode] = useState('offers'); // 'offers' or 'percentage'

  // Extract raw industry trends
  const rawIndustryData = useMemo(() => {
    return (
      data?.placement_cell?.recruiter_health?.yearly_trends?.by_industry || []
    );
  }, [data]);

  // Available years from data
  const availableYears = useMemo(() => {
    if (!rawIndustryData || rawIndustryData.length === 0) return [];
    const yearsSet = new Set(
      rawIndustryData
        .map((d) => d.placement_year)
        .filter(Boolean)
    );
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [rawIndustryData]);

  // Aggregate by industry
  const chartData = useMemo(() => {
    if (!rawIndustryData || rawIndustryData.length === 0) return [];

    const filtered =
      selectedYear === 'All'
        ? rawIndustryData
        : rawIndustryData.filter(
            (d) => String(d.placement_year) === String(selectedYear)
          );

    const industryMap = {};
    let totalAggregatedOffers = 0;

    filtered.forEach((item) => {
      const industry = item.company__industry || 'General / IT Services';
      const count = Number(item.total_offers) || 0;
      if (!industryMap[industry]) {
        industryMap[industry] = 0;
      }
      industryMap[industry] += count;
      totalAggregatedOffers += count;
    });

    const entries = Object.entries(industryMap)
      .map(([industry, offers]) => ({
        industry,
        offers,
        percentage:
          totalAggregatedOffers > 0
            ? Number(((offers / totalAggregatedOffers) * 100).toFixed(1))
            : 0,
        color: SECTOR_COLORS[industry] || SECTOR_COLORS.Other,
      }))
      .sort((a, b) => b.offers - a.offers);

    return {
      entries,
      totalOffers: totalAggregatedOffers,
      topSector: entries[0] || null,
    };
  }, [rawIndustryData, selectedYear]);

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[320px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-56 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    );
  }

  if (!rawIndustryData || rawIndustryData.length === 0 || !chartData.entries || chartData.entries.length === 0) {
    return (
      <ChartEmptyState
        title="Hiring Industry Sector Distribution"
        message="Technical issue: Economic sector recruitment distribution data is not available."
      />
    );
  }

  return (
    <ChartCard
      title="Hiring Industry Sector Distribution"
      subtitle="Recruitment offer absorption partitioned across economic sectors"
      badge={
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
          <Building2 className="w-3 h-3 text-emerald-600" />
          <span>{chartData.entries.length} Active Sectors</span>
        </div>
      }
      action={
        <div className="flex items-center gap-2">
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Cycles (2020-2025)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Cycle {yr}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setMetricMode('offers')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                metricMode === 'offers'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Offers
            </button>
            <button
              onClick={() => setMetricMode('percentage')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                metricMode === 'percentage'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Share %
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[320px] justify-between">
        {/* Dominant sector hero chip */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">
                  Dominant Sector
                </div>
                <div className="text-xs font-bold text-emerald-950 truncate max-w-[110px]">
                  {chartData.topSector?.industry || 'N/A'}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700">
              {chartData.topSector?.percentage}%
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Total Offers
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {chartData.totalOffers} Offers
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {selectedYear === 'All' ? 'Combined' : selectedYear}
            </span>
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="flex-1 w-full min-h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData.entries}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                domain={[0, 'dataMax + 5']}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tick={{ fill: '#64748B', fontSize: 11 }}
                unit={metricMode === 'percentage' ? '%' : ''}
              />
              <YAxis
                dataKey="industry"
                type="category"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                width={100}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg border border-slate-700">
                        <p className="font-semibold text-slate-200">{row.industry}</p>
                        <p className="text-emerald-400 font-medium mt-1">
                          Offers: <span className="font-bold">{row.offers}</span>
                        </p>
                        <p className="text-slate-300">
                          Sector Share:{' '}
                          <span className="font-bold text-white">{row.percentage}%</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={metricMode === 'percentage' ? 'percentage' : 'offers'}
                radius={[0, 6, 6, 0]}
                barSize={16}
              >
                {chartData.entries.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend Chips */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Economic sector absorption metrics validated across corporate drives</span>
          </div>
          <span className="font-semibold text-slate-700">
            {chartData.entries.length} Sectors
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
