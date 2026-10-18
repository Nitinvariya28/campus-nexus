import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeedFilterTabs from '../feed/FeedFilterTabs';
import { Search, Menu } from 'lucide-react';

/**
 * CommunityHeader Component
 * Sticky Top Community Header (Fixed below main navbar at top-16):
 * - Mobile (< lg): Three-lines (hamburger) button to open Left Sidebar drawer.
 * - Left: 4 Multi-Choice Filter Options ([All] [Student] [Alumni] [Placement Cell])
 *   with horizontal touch-scrolling on mobile.
 * - Right: Search input option with margins, search icon, and clear button.
 * - Sticky below top navbar (top-16 z-30) so when scrolling down the feed,
 *   the filter options and search bar remain visible.
 */
export default function CommunityHeader({
  selectedTypes,
  onSelectionChange,
  onSearch,
  onToggleMobileMenu,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      }
      navigate(`/community/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 py-2.5 px-3 sm:px-5 rounded-xl shadow-xs mb-4 transition-all">
      {/* DESKTOP & TABLET VIEW (md: and up) */}
      <div className="hidden md:flex md:items-center justify-between gap-4">
        {/* Left Side: 4 Filter Pills in clean single row */}
        <div className="flex items-center gap-2.5 min-w-0">
          <FeedFilterTabs
            selectedTypes={selectedTypes}
            onSelectionChange={onSelectionChange}
          />
        </div>

        {/* Right Side: Search Input */}
        <div className="w-72 lg:w-80 shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members, alumni, topics..."
              className="w-full pl-9 pr-9 py-1.5 bg-slate-50/90 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
                title="Clear"
              >
                ✕
              </button>
            )}
          </form>
        </div>
      </div>

      {/* MOBILE VIEW (< md) */}
      <div className="md:hidden flex flex-col gap-2.5">
        {/* Mobile Row 1: [☰ Activity] Button + Search Input */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/90 transition-colors shrink-0 cursor-pointer shadow-2xs"
            aria-label="Open Activity Menu"
            title="Activity & Views"
          >
            <Menu className="w-4 h-4 text-blue-600" />
            <span>Activity</span>
          </button>

          <div className="flex-1 min-w-0">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                >
                  ✕
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Mobile Row 2: The 4 Filter Options in a Single Clean Horizontal Row (Never Wrap) */}
        <div className="w-full overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          <FeedFilterTabs
            selectedTypes={selectedTypes}
            onSelectionChange={onSelectionChange}
          />
        </div>
      </div>
    </div>
  );
}
