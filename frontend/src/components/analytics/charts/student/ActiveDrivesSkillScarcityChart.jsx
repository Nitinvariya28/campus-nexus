import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { AlertOctagon, Briefcase, Users, ShieldAlert } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const STATUS_CONFIG = {
  CRITICAL_SHORTAGE: {
    label: 'Critical Shortage',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    color: '#E11D48',
  },
  MODERATE_SHORTAGE: {
    label: 'Moderate Shortage',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    color: '#F59E0B',
  },
  HEALTHY_SUPPLY: {
    label: 'Healthy Supply',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    color: '#10B981',
  },
};

/**
 * ActiveDrivesSkillScarcityChart Component (Visual 11 - Student Dashboard Row 5 Col 2)
 * Replaces the static directory table with a proper corporate recruitment talent scarcity visualization.
 * Compares open campus recruitment drive requirements against qualified student supply.
 * Strictly consumes live API data from data.student.market_skill_gaps.open_drive_scarcity.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function ActiveDrivesSkillScarcityChart({ data, loading = false }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'critical' | 'moderate'

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-52 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const scarcityList =
    data?.student?.market_skill_gaps?.open_drive_scarcity || [];

  if (!scarcityList || scarcityList.length === 0) {
    return (
      <ChartCard
        title="Campus Drive Skill Scarcity"
        subtitle="Corporate recruitment requirements vs available qualified candidates"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Drive Scarcity Data Unavailable"
          message="Technical issue: Campus recruitment drive skill scarcity data is not available."
        />
      </ChartCard>
    );
  }

  // Filter based on selected mode
  const filteredList = scarcityList.filter((item) => {
    if (filterMode === 'critical') return item.scarcity_status === 'CRITICAL_SHORTAGE';
    if (filterMode === 'moderate') return item.scarcity_status === 'MODERATE_SHORTAGE';
    return true;
  });

  const chartData = filteredList.slice(0, 7).map((item) => {
    const oppCount = Number(item.open_opportunities_requiring_skill) || 0;
    const studentCount = Number(item.total_eligible_students_with_skill) || 0;
    const statusCfg = STATUS_CONFIG[item.scarcity_status] || STATUS_CONFIG.MODERATE_SHORTAGE;

    return {
      skill: item.skill__name,
      drivesCount: oppCount,
      qualifiedStudents: studentCount,
      status: item.scarcity_status,
      statusLabel: statusCfg.label,
      statusColor: statusCfg.color,
    };
  });

  const criticalCount = scarcityList.filter(
    (s) => s.scarcity_status === 'CRITICAL_SHORTAGE'
  ).length;

  return (
    <ChartCard
      title="Campus Drive Talent Scarcity"
      subtitle="Open corporate drives vs available qualified student talent"
      heightClass="h-auto"
      actionSlot={
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              filterMode === 'all'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Demands ({scarcityList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('critical')}
            className={`px-2 py-0.5 rounded-md font-medium transition-all ${
              filterMode === 'critical'
                ? 'bg-white text-rose-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Critical ({criticalCount})
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Paired Bar Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 30, left: 15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="skill"
                tick={{ fill: '#334155', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800">{item.skill}</div>
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between gap-4 text-purple-700">
                          <span>Open Drives Requiring Skill:</span>
                          <span className="font-bold">{item.drivesCount} drives</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-slate-700">
                          <span>Qualified Students Available:</span>
                          <span className="font-bold">{item.qualifiedStudents} candidates</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100 font-semibold">
                          <span>Scarcity Rating:</span>
                          <span style={{ color: item.statusColor }}>{item.statusLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
              />
              <Bar
                dataKey="drivesCount"
                name="Corporate Drives Seeking Skill"
                fill="#8B5CF6"
                radius={[0, 4, 4, 0]}
                barSize={9}
              />
              <Bar
                dataKey="qualifiedStudents"
                name="Eligible Qualified Students"
                fill="#10B981"
                radius={[0, 4, 4, 0]}
                barSize={9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Actionable Placement Alert Banner */}
        <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-rose-900">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="font-medium">Drive Scarcity Alert:</span>
            <span className="font-bold">
              {criticalCount} Corporate Drives Risk Zero Qualified Candidates
            </span>
          </div>
          <span className="text-[11px] font-semibold text-rose-700 shrink-0">
            High Priority
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
