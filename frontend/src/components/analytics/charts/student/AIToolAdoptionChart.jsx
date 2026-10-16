import React, { useState } from 'react';
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
import { Bot, Clock, Target, Sparkles, BrainCircuit } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const PURPOSE_META = {
  CODING: { label: 'Coding & Development', color: '#3B82F6', icon: '💻' },
  INTERVIEW_PREPARATION: { label: 'Interview Preparation', color: '#8B5CF6', icon: '🎯' },
  LEARNING: { label: 'Concept Learning & Theory', color: '#F59E0B', icon: '📚' },
  DEBUGGING: { label: 'Debugging & Diagnostics', color: '#10B981', icon: '🐞' },
  RESEARCH: { label: 'Technical Research', color: '#06B6D4', icon: '🔍' },
  PROJECT_DEVELOPMENT: { label: 'Project Architecture', color: '#EC4899', icon: '🚀' },
};

const TIME_RANGE_META = {
  '1_TO_2_HOURS': { label: '1 to 2 Hours / Day', sublabel: 'Moderate daily workflow integration', color: '#4F46E5' },
  '30_TO_60_MIN': { label: '30 to 60 Mins / Day', sublabel: 'Quick queries & assistance', color: '#0D9488' },
  '2_TO_4_HOURS': { label: '2 to 4 Hours / Day', sublabel: 'Heavy engineering pair programming', color: '#7C3AED' },
  'LESS_THAN_30_MIN': { label: '< 30 Mins / Day', sublabel: 'Occasional reference', color: '#64748B' },
  'MORE_THAN_4_HOURS': { label: '> 4 Hours / Day', sublabel: 'Continuous copilot usage', color: '#BE123C' },
};

const TOOL_META = {
  CHATGPT: { name: 'ChatGPT', color: '#10A37F' },
  GITHUB_COPILOT: { name: 'GitHub Copilot', color: '#24292F' },
  CLAUDE: { name: 'Claude', color: '#D97706' },
  CURSOR: { name: 'Cursor', color: '#6366F1' },
  GEMINI: { name: 'Gemini', color: '#2563EB' },
};

/**
 * AIToolAdoptionChart Component (Visual 9 - Student Dashboard Row 4 Col 3)
 * Interactive multi-view widget analyzing:
 * 1. "Why Students Use AI" (Purposes: Coding, Interview Prep, Learning, Debugging).
 * 2. "Daily Hours Spent" (Study time distribution: 1-2h, 30-60m, 2-4h).
 * 3. "AI Tools Breakdown" (ChatGPT, Copilot, Claude, Cursor, Gemini).
 *
 * Strictly consumes live API data from data.student.learning_and_ai.ai_usage.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AIToolAdoptionChart({ data, loading = false }) {
  const [activeTab, setActiveTab] = useState('purposes'); // 'purposes' | 'hours' | 'tools'

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const aiUsage = data?.student?.learning_and_ai?.ai_usage || {};
  const toolsOverview = aiUsage.tools_overview || [];
  const purposesOverview = aiUsage.purposes_overview || [];
  const timeOverview = aiUsage.time_range_overview || [];

  if (toolsOverview.length === 0 && purposesOverview.length === 0) {
    return (
      <ChartCard
        title="AI Assistant Adoption & Hours"
        subtitle="Daily usage hours, purpose breakdown & tool distribution"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="AI Usage Data Unavailable"
          message="Technical issue: AI assistant usage and daily study hours data is not available."
        />
      </ChartCard>
    );
  }

  // Purpose Data
  const purposeChartData = purposesOverview.map((item) => {
    const rawKey = item.usage_purpose;
    const meta = PURPOSE_META[rawKey] || {
      label: rawKey.replace('_', ' '),
      color: '#4F46E5',
      icon: '⚡',
    };
    return {
      rawKey,
      name: meta.label,
      users: Number(item.distinct_users) || 0,
      color: meta.color,
      icon: meta.icon,
    };
  });

  // Daily Time Range Data (Hours Spent)
  const timeChartData = timeOverview.map((item) => {
    const rawKey = item.daily_time_range;
    const meta = TIME_RANGE_META[rawKey] || {
      label: rawKey.replace(/_/g, ' '),
      sublabel: 'Daily time spent',
      color: '#6366F1',
    };
    return {
      rawKey,
      name: meta.label,
      sublabel: meta.sublabel,
      users: Number(item.distinct_users) || 0,
      color: meta.color,
    };
  });

  // Tools Data
  const toolsChartData = toolsOverview.map((item) => {
    const rawKey = item.ai_tool;
    const meta = TOOL_META[rawKey] || { name: rawKey, color: '#4F46E5' };
    return {
      rawKey,
      name: meta.name,
      users: Number(item.distinct_users) || 0,
      color: meta.color,
    };
  });

  // Active dataset based on selected tab
  const activeData =
    activeTab === 'purposes'
      ? purposeChartData
      : activeTab === 'hours'
      ? timeChartData
      : toolsChartData;

  const totalRespondents = Math.max(
    ...purposeChartData.map((d) => d.users),
    ...toolsChartData.map((d) => d.users),
    1
  );

  return (
    <ChartCard
      title="AI Adoption & Study Hours"
      subtitle="Why students use AI, daily study hours, and top assistants"
      heightClass="h-auto"
      actionSlot={
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('purposes')}
            className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'purposes'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Why Used
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'hours'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Hours
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'tools'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Top Tools
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Dynamic Metric Bar Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeData}
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
                dataKey="name"
                tick={{ fill: '#334155', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={activeTab === 'purposes' ? 120 : activeTab === 'hours' ? 100 : 90}
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
                      <div className="flex items-center justify-between gap-4 mt-1.5 text-slate-600">
                        <span>Distinct Students:</span>
                        <span className="font-bold text-slate-900">{item.users} users</span>
                      </div>
                      {item.sublabel && (
                        <div className="text-[10px] text-slate-400 mt-1">{item.sublabel}</div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="users" radius={[0, 4, 4, 0]} barSize={13}>
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Contextual Callout Footer */}
        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs">
          {activeTab === 'purposes' && (
            <>
              <div className="flex items-center gap-1.5 text-indigo-900">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium">#1 Primary Purpose:</span>
                <span className="font-bold">{purposeChartData[0]?.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700">
                {purposeChartData[0]?.users} Students
              </span>
            </>
          )}

          {activeTab === 'hours' && (
            <>
              <div className="flex items-center gap-1.5 text-indigo-900">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium">Most Common Study Time:</span>
                <span className="font-bold">{timeChartData[0]?.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700">
                {timeChartData[0]?.users} Students (Heavy Daily Adoption)
              </span>
            </>
          )}

          {activeTab === 'tools' && (
            <>
              <div className="flex items-center gap-1.5 text-indigo-900">
                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-medium">Top Preferred Tool:</span>
                <span className="font-bold">{toolsChartData[0]?.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700">
                {toolsChartData[0]?.users} Active Users
              </span>
            </>
          )}
        </div>
      </div>
    </ChartCard>
  );
}
