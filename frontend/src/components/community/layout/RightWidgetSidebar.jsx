import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building2,
  ShieldCheck,
  Filter,
  ArrowUpDown,
  Briefcase,
  Calendar,
  X,
  Loader2,
} from 'lucide-react';
import TagBadge from '../common/TagBadge';
import {
  POST_CATEGORY_FILTERS,
  SORT_OPTIONS,
} from '../../../constants/community/communityConstants';
import { fetchCommunityWidgets } from '../../../services/community/communityService';
import { useCommunityFilter } from '../../../context/CommunityFilterContext';

/**
 * RightWidgetSidebar Component
 * Right rail w-64 to w-72 (sticky top-20).
 * Complete, high-performance right sidebar containing:
 * 1. Quick Category Filters & Sort Controls (integrated with CommunityFilterContext)
 * 2. Real Analytics Trending Topics & Hashtags with live post counts
 * 3. Real Active Hiring Drives from University Placement Cell
 * 4. Campus Mentors & Network Pulse
 * 5. University Community Integrity Notice
 */
export default function RightWidgetSidebar({
  onTagClick: propOnTagClick,
  selectedCategories: propCategories,
  onCategoryToggle: propCategoryToggle,
  sortBy: propSortBy,
  onSortChange: propSortChange,
}) {
  // Gracefully connect to CommunityFilterContext if present
  let filterContext = null;
  try {
    filterContext = useCommunityFilter();
  } catch (e) {
    // Falls back to props if rendered outside provider
  }

  const selectedCategories = filterContext?.selectedCategories ?? propCategories ?? [];
  const sortBy = filterContext?.sortBy ?? propSortBy ?? 'latest';
  const activeTag = filterContext?.activeTag ?? null;

  // Real backend widget data state
  const [widgetsData, setWidgetsData] = useState({
    trending_topics: [],
    active_drives: [],
  });
  const [isLoadingWidgets, setIsLoadingWidgets] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadWidgets = async () => {
      try {
        setIsLoadingWidgets(true);
        const data = await fetchCommunityWidgets();
        if (isMounted && data) {
          setWidgetsData({
            trending_topics: data.trending_topics || [],
            active_drives: data.active_drives || [],
          });
        }
      } catch (err) {
        console.error('Failed to load community widgets:', err);
      } finally {
        if (isMounted) {
          setIsLoadingWidgets(false);
        }
      }
    };

    loadWidgets();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryClick = (catId) => {
    if (filterContext?.toggleCategory) {
      filterContext.toggleCategory(catId);
    }
    if (propCategoryToggle) {
      propCategoryToggle(catId);
    }
  };

  const handleSortClick = (sortId) => {
    if (filterContext?.setSortBy) {
      filterContext.setSortBy(sortId);
    }
    if (propSortChange) {
      propSortChange(sortId);
    }
  };

  const handleTagClick = (tag) => {
    if (filterContext?.selectTag) {
      filterContext.selectTag(tag);
    }
    if (propOnTagClick) {
      propOnTagClick(tag);
    }
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
              {sortBy}
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {POST_CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold ring-2 ring-blue-600/30'
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
                  sortBy === opt.id
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

      {/* 2. Trending Topics / Real Analytics Widget */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Trending Topics
            </h4>
          </div>
          {activeTag && (
            <button
              type="button"
              onClick={() => handleTagClick(activeTag)}
              className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              <span>Clear</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {isLoadingWidgets ? (
          <div className="space-y-2 py-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="h-5 bg-slate-100 rounded w-28" />
                <div className="h-4 bg-slate-100 rounded w-12" />
              </div>
            ))}
          </div>
        ) : widgetsData.trending_topics.length > 0 ? (
          <div className="space-y-1.5">
            {widgetsData.trending_topics.map((topic) => {
              const cleanTopic = topic.raw_name || topic.tag.replace(/^#/, '');
              const isSelected = activeTag === cleanTopic;

              return (
                <div
                  key={topic.id || topic.tag}
                  className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 border border-blue-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <TagBadge
                    tag={topic.tag}
                    onClick={() => handleTagClick(cleanTopic)}
                    className={isSelected ? 'ring-2 ring-blue-500 font-bold' : ''}
                  />
                  <span className="text-[11px] font-medium text-slate-400">
                    {topic.count} {topic.count === 1 ? 'post' : 'posts'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2 text-center">No trending topics yet.</p>
        )}
      </div>

      {/* 3. Top Active Hiring Drives Widget */}
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

        {isLoadingWidgets ? (
          <div className="space-y-2 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-1">
                <div className="h-4 bg-slate-100 rounded w-24" />
                <div className="h-3 bg-slate-100 rounded w-36" />
              </div>
            ))}
          </div>
        ) : widgetsData.active_drives.length > 0 ? (
          <div className="space-y-2.5">
            {widgetsData.active_drives.map((drive) => (
              <div
                key={drive.id}
                className="text-xs hover:bg-slate-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-100 space-y-1"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-slate-800 truncate">
                    {drive.company_name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      drive.opportunity_type === 'INTERNSHIP'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {drive.opportunity_type === 'INTERNSHIP' ? 'Intern' : 'Drive'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{drive.role}</span>
                </div>
                {drive.salary_package && (
                  <div className="text-[10px] font-medium text-emerald-700 bg-emerald-50/60 px-1.5 py-0.5 rounded w-fit">
                    ₹{drive.salary_package} LPA
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-2 text-center">No active drives right now.</p>
        )}
      </div>

      {/* 4. University Community Integrity Notice */}
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
