import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Cpu, Terminal, Filter } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const CATEGORY_COLORS = {
  'Cloud Tool': '#06B6D4',           // Cyan
  'Programming Language': '#4F46E5', // Indigo
  'Database': '#10B981',             // Emerald
  'Other': '#8B5CF6',                // Purple
};

/**
 * AlumniTechCompetencyChart Component (Visual 7 - Row 5 Col 1)
 * Displays the top production technologies, programming languages, cloud tools,
 * and databases actively utilized by verified alumni in the tech industry.
 *
 * Strictly consumes live API data from:
 * data.alumni.career_paths.employment_demographics.top_skills
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniTechCompetencyChart({ data, loading = false }) {
  const [activeFilter, setActiveFilter] = useState('ALL');

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[420px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-3 w-60 bg-slate-100 rounded" />
        </div>
        <div className="space-y-2.5 my-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const rawSkills = data?.alumni?.career_paths?.employment_demographics?.top_skills || [];

  if (!rawSkills || rawSkills.length === 0) {
    return (
      <ChartCard
        title="Production Tech Stack"
        subtitle="Technologies utilized by verified alumni in industry"
        heightClass="h-[420px]"
      >
        <ChartEmptyState
          title="Skills Data Unavailable"
          message="Technical issue: Alumni technical competency data is not available."
        />
      </ChartCard>
    );
  }

  const filteredSkills = activeFilter === 'ALL'
    ? rawSkills.slice(0, 8)
    : rawSkills
        .filter((s) => {
          const cat = s.skill__category__name || '';
          if (activeFilter === 'CLOUD') return cat.toLowerCase().includes('cloud');
          if (activeFilter === 'LANG') return cat.toLowerCase().includes('language');
          if (activeFilter === 'DB') return cat.toLowerCase().includes('database');
          return true;
        })
        .slice(0, 8);

  const chartData = filteredSkills.map((s, idx) => {
    const name = s.skill__name;
    const cat = s.skill__category__name || 'Other';
    const count = Number(s.alumni_count) || 0;
    const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;

    return {
      name,
      category: cat,
      count,
      color,
      rank: `#${idx + 1}`,
    };
  });

  const topSkill = chartData[0];

  return (
    <ChartCard
      title="Production Tech Stack"
      subtitle="Industry technologies mastered by alumni"
      heightClass="h-auto"
      actionSlot={
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'CLOUD', label: 'Cloud' },
            { id: 'LANG', label: 'Code' },
            { id: 'DB', label: 'DB' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-1.5 py-0.5 rounded transition-all ${
                activeFilter === tab.id
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Horizontal Bars */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 30, left: 10, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
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
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </div>
                      <div className="text-slate-500 mt-1">
                        {item.count} alumni actively proficient
                      </div>
                      <div className="text-[10px] text-indigo-600 mt-0.5 font-medium">
                        Category: {item.category}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Category Tags */}
        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 px-1 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4]" /> Cloud & DevOps
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#4F46E5]" /> Languages
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Databases
          </span>
        </div>

        {/* Footer Insight Callout */}
        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-indigo-800 min-w-0">
            <Terminal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">
              #1 Tech Skill: <strong className="text-indigo-900">{topSkill?.name}</strong>
            </span>
          </div>
          <span className="font-bold text-indigo-700 shrink-0">
            {topSkill?.count} Alumni
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
