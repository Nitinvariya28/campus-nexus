import React, { useState } from 'react';
import {
  TrendingUp,
  Building2,
  ShieldCheck,
  Users,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import TagBadge from '../common/TagBadge';
import {
  TRENDING_TOPICS,
  TOP_RECRUITING_COMPANIES,
  POST_CATEGORY_FILTERS,
  SORT_OPTIONS,
} from '../../../constants/community/communityConstants';

/**
 * RightWidgetSidebar Component
 * Right rail w-64 to w-72 (sticky top-20).
 * Complete, rich right sidebar containing:
 * 1. Quick Category Filters & Sort Controls
 * 2. Trending Topics & Hashtags with post counts
 * 3. Top Recruiting Drives & Company Offers
 * 4. Campus Mentors & Network Pulse
 * 5. University Community Integrity Notice
 */
export default function RightWidgetSidebar({
  onTagClick = () => {},
  selectedCategories = [],
  onCategoryToggle = () => {},
  sortBy = 'latest',
  onSortChange = () => {},
}) {
  const [activeSort, setActiveSort] = useState(sortBy);
  const [activeCats, setActiveCats] = useState(selectedCategories);

  const handleCategoryClick = (catId) => {
    const updated = activeCats.includes(catId)
      ? activeCats.filter((c) => c !== catId)
      : [...activeCats, catId];
    setActiveCats(updated);
    onCategoryToggle(updated);
  };

  const handleSortClick = (sortId) => {
    setActiveSort(sortId);
    onSortChange(sortId);
  };

  return (
    <aside className="w-64 xl:w-72 shrink-0 space-y-4">
      {/* 1. Quick Category & Sort Controls */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Explore Categories
            </h4>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase">
              {activeSort}
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {POST_CATEGORY_FILTERS.map((cat) => {
            const isSelected = activeCats.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sort Toggle */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">Sort by:</span>
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSortClick(opt.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  activeSort === opt.id
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Trending Topics / Hashtags Widget */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Trending Topics
            </h4>
          </div>
          <span className="text-[10px] font-medium text-slate-400">Weekly</span>
        </div>

        <div className="space-y-2">
          {TRENDING_TOPICS.map((topic) => (
            <div
              key={topic.tag}
              className="flex items-center justify-between text-xs hover:bg-slate-50 p-1 rounded-lg transition-colors"
            >
              <TagBadge tag={topic.tag} onClick={() => onTagClick(topic.tag)} />
              <span className="text-[11px] font-medium text-slate-400">
                {topic.count} posts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Top Recruiting Organizations Widget */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Top Hiring Drives
            </h4>
          </div>
          <span className="text-[10px] font-medium text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Active
          </span>
        </div>

        <div className="space-y-2.5">
          {TOP_RECRUITING_COMPANIES.map((company) => (
            <div
              key={company.name}
              className="flex items-center justify-between text-xs hover:bg-slate-50 p-1 rounded-lg transition-colors"
            >
              <div>
                <span className="font-semibold text-slate-800 block">
                  {company.name}
                </span>
                <span className="text-[11px] text-slate-400">{company.role}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                {company.offers} offers
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Campus Mentorship & Activity Pulse Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-600" />
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Campus Mentors
          </h4>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Over 450+ verified alumni and seniors are actively sharing interview insights and placement referrals.
        </p>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Active this week</span>
          <span className="font-bold text-slate-900">128 Members</span>
        </div>
      </div>

      {/* 5. University Community Integrity Notice */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Verified Campus Nexus</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          All profiles are verified through institutional credentials. Keep discussions professional, supportive, and constructive.
        </p>
      </div>
    </aside>
  );
}
