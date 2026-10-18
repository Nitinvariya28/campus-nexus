import React, { useState } from 'react';
import CommunityHeader from './CommunityHeader';
import LeftProfileSidebar from './LeftProfileSidebar';
import RightWidgetSidebar from './RightWidgetSidebar';
import { X, Sparkles } from 'lucide-react';

/**
 * CommunityLayout Component
 * Master 3-Column Responsive Layout:
 * - TOP Header: Sticky below navbar (top-16 z-30), multi-choice filter pills (Left) + Search input (Right)
 *   + Mobile 'three-lines' button (☰) to access the Left Sidebar activity drawer.
 * - LEFT Rail: Profile summary, [+ Create Post] CTA, Your Posts, Saved Posts, Manage Your Posts, Engagement.
 *   (Visible on lg: and above; accessible via slide-out drawer on mobile/tablet).
 * - MIDDLE Stream: Dynamic content viewport, compact and fully responsive on mobile.
 * - RIGHT Rail: Contextual category & sort filters, Trending topics, Top hiring drives, Mentors, Guidelines.
 *   (Skipped on mobile screens as requested; visible on lg: and above).
 */
export default function CommunityLayout({
  children,
  selectedTypes,
  onSelectionChange,
  onSearch = () => {},
  onCreatePost,
  onTagClick = () => {},
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="w-full">
      {/* 1. Sticky Top Header (Fixed below Navbar at top-16) */}
      <CommunityHeader
        selectedTypes={selectedTypes}
        onSelectionChange={onSelectionChange}
        onSearch={onSearch}
        onToggleMobileMenu={() => setMobileDrawerOpen((prev) => !prev)}
      />

      {/* 2. Three-Column Synchronized Layout: Left + Middle + Right */}
      <div className="flex justify-center items-start gap-4 xl:gap-5">
        {/* LEFT COLUMN: Profile & Navigation Rail (Desktop: Sticky top-[136px], never clipped) */}
        <div className="hidden lg:block shrink-0 sticky top-[136px] w-60 xl:w-64 max-h-[calc(100vh-9.5rem)] overflow-y-auto no-scrollbar">
          <LeftProfileSidebar onCreatePost={onCreatePost} />
        </div>

        {/* MIDDLE COLUMN: Main Content & Dynamic Viewport Stream */}
        <main className="flex-1 min-w-0 max-w-2xl w-full">
          {children}
        </main>

        {/* RIGHT COLUMN: Rich Information & Widgets Rail (Desktop: Sticky top-[136px]) */}
        <div className="hidden lg:block shrink-0 sticky top-[136px] w-64 xl:w-72 max-h-[calc(100vh-9.5rem)] overflow-y-auto no-scrollbar">
          <RightWidgetSidebar onTagClick={onTagClick} />
        </div>
      </div>

      {/* 3. Mobile Activity Drawer: Left Sidebar Options Slide-Out Sheet for Small Devices */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-slate-50 shadow-2xl z-50 flex flex-col p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Community Activity</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reusable Left Sidebar Content */}
            <div className="flex-1">
              <LeftProfileSidebar
                onCreatePost={onCreatePost}
                onItemClick={() => setMobileDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
