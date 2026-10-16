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
import { Code2, Globe, GraduationCap, Trophy, Sparkles } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const DOMAIN_COLORS = {
  coding: ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4'],
  web: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
  courses: ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'],
  all: ['#059669', '#4F46E5', '#D97706', '#2563EB', '#7C3AED', '#E11D48', '#0284C7'],
};

const DOMAIN_INSIGHTS = {
  coding: {
    title: 'Best for Coding & Competitive Programming / DSA',
    best: 'LeetCode & Codeforces',
    desc: 'Dominant platforms chosen by placed candidates for algorithmic problem-solving & FAANG interviews.',
    icon: Code2,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  web: {
    title: 'Best for Full-Stack Web Development & Frameworks',
    best: 'freeCodeCamp.org & The Net Ninja',
    desc: 'Top choice for practical JavaScript, React, Node.js project tutorials and certifications.',
    icon: Globe,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  courses: {
    title: 'Best for Structured Courses, Cloud & Architecture',
    best: 'Pluralsight & Udemy',
    desc: 'Favored for end-to-end cloud computing, microservices, and system architecture certifications.',
    icon: GraduationCap,
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  all: {
    title: 'Overall Student Learning Ecosystem Ranking',
    best: 'freeCodeCamp.org',
    desc: 'Highest global student engagement across all engineering branches.',
    icon: Trophy,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

/**
 * LearningPlatformsChart Component (Visual 8 - Student Dashboard Row 4 Col 2)
 * Interactive Technical Domain Learning Hub:
 * Enables students and faculty to see which platform is best for Coding/DSA,
 * Web Development, and Structured Courses.
 *
 * Strictly consumes live API data from data.student.learning_and_ai.learning_platforms.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function LearningPlatformsChart({ data, loading = false }) {
  const [activeTab, setActiveTab] = useState('coding'); // 'coding' | 'web' | 'courses' | 'all'

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
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const platformsObj = data?.student?.learning_and_ai?.learning_platforms || {};
  const globalList = platformsObj.global_preferences || [];
  const byType = platformsObj.by_platform_type || {};

  const codingList = byType.coding_platforms || [];
  const webList = byType.web_and_youtube || [];
  const coursesList = byType.course_websites || [];

  if (globalList.length === 0 && codingList.length === 0) {
    return (
      <ChartCard
        title="Learning Platforms by Domain"
        subtitle="Best platforms for Coding, Web Development & Courses"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Platform Data Unavailable"
          message="Technical issue: Technical learning platform domain data is not available."
        />
      </ChartCard>
    );
  }

  // Choose active list
  const currentRawList =
    activeTab === 'coding'
      ? codingList.length > 0 ? codingList : globalList.filter((p) => /leetcode|codeforces|kaggle|code/i.test(p.platform__name))
      : activeTab === 'web'
      ? webList.length > 0 ? webList : globalList.filter((p) => /freecodecamp|ninja|harry|traversy|youtube/i.test(p.platform__name))
      : activeTab === 'courses'
      ? coursesList.length > 0 ? coursesList : globalList.filter((p) => /pluralsight|udemy|coursera|datacamp/i.test(p.platform__name))
      : globalList;

  const chartData = currentRawList.slice(0, 5).map((item, idx) => ({
    rank: `#${idx + 1}`,
    name: item.platform__name,
    count: Number(item.count || item.user_count) || 0,
  }));

  const colors = DOMAIN_COLORS[activeTab] || DOMAIN_COLORS.all;
  const domainInfo = DOMAIN_INSIGHTS[activeTab] || DOMAIN_INSIGHTS.coding;
  const DomainIcon = domainInfo.icon;

  return (
    <ChartCard
      title="Upskilling Platforms by Domain"
      subtitle="Which platform is best for Coding, Web Dev, and Courses"
      heightClass="h-auto"
      actionSlot={
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('coding')}
            className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'coding'
                ? 'bg-white text-rose-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Coding / DSA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('web')}
            className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'web'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Web Dev
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'courses'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Courses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-1.5 py-0.5 rounded-md font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Ranked Platform Bars */}
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
                dataKey="name"
                tick={{ fill: '#334155', fontSize: 10, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="font-bold text-indigo-600">{item.rank}</span>
                        {item.name}
                      </div>
                      <div className="flex items-center justify-between gap-4 mt-1.5 text-slate-600">
                        <span>Active Student Learners:</span>
                        <span className="font-bold text-slate-900">{item.count} users</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Domain Recommendation Banner */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <DomainIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <div className="truncate">
              <span className="font-medium text-slate-600">Top Platform: </span>
              <span className="font-bold text-slate-900">{chartData[0]?.name}</span>
              <span className="text-slate-400 text-[11px] ml-1 hidden sm:inline">
                ({chartData[0]?.count} students)
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
            Rank #1
          </span>
        </div>
      </div>
    </ChartCard>
  );
}
