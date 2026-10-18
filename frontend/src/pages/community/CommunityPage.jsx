import React from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import CommunityLayout from '../../components/community/layout/CommunityLayout';
import { Rss, FileText, Settings, Plus, CheckCircle2, Filter, ArrowLeft } from 'lucide-react';
import RoleBadgePill from '../../components/community/common/RoleBadgePill';

/**
 * CommunityPage Component
 * Orchestrates the main content area based on the selected navigation view:
 * - /community -> Community Feed (with top filter pills, search bar, and right sidebar)
 * - /community/create -> Create Post View
 * - /community/my-posts -> Your Posts View
 * - /community/manage -> Manage Your Posts View
 */
export default function CommunityPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Active post-type filters (supports multi-selection per docx Section 4.1)
  const activeTypes = searchParams.get('types')?.split(',').filter(Boolean) || ['ALL'];

  const isCreate = location.pathname.includes('/create');
  const isMyPosts = location.pathname.includes('/my-posts');
  const isManage = location.pathname.includes('/manage');

  // View 2: Create Post Form View
  if (isCreate) {
    return (
      <CommunityLayout>
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Create Post</h1>
                <p className="text-xs text-slate-500">
                  Route: /community/create · Post Creation Form Viewport
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/community"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Feed</span>
              </Link>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Navigation Active</span>
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Create Post Form Viewport
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides the form required to create a post (Standard Post, Interview Experience, Opportunity, Announcement). After submission, it returns to the feed and displays the new post.
            </p>
          </div>
        </div>
      </CommunityLayout>
    );
  }

  // View 3: Your Posts View
  if (isMyPosts) {
    return (
      <CommunityLayout>
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Your Posts</h1>
                <p className="text-xs text-slate-500">
                  Route: /community/my-posts · Author Activity Viewport
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/community"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Feed</span>
              </Link>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Navigation Active</span>
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Your Posts Viewport
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Displays exclusively the posts and discussions created by the logged-in user, tracking their engagement and feedback.
            </p>
          </div>
        </div>
      </CommunityLayout>
    );
  }

  // View 5: Manage Your Posts View (CRUD)
  if (isManage) {
    return (
      <CommunityLayout>
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Manage Your Posts</h1>
                <p className="text-xs text-slate-500">
                  Route: /community/manage · Post Management &amp; CRUD Viewport
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/community"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Feed</span>
              </Link>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Navigation Active</span>
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Manage Your Posts Viewport
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Allows logged-in users to manage their published content: Create, Read, Update, and Delete posts according to backend permissions.
            </p>
          </div>
        </div>
      </CommunityLayout>
    );
  }

  // View 1: Community Feed (Default)
  return (
    <CommunityLayout>
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        {/* Page Identity Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Rss className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Community Feed</h1>
              <p className="text-xs text-slate-500">
                Route: /community · Filtered Post Feed Viewport
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Navigation Active</span>
          </span>
        </div>

        {/* Live Filter Selection Feedback */}
        <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-medium text-slate-700">Active Post Types:</span>
            {activeTypes.includes('ALL') ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                All
              </span>
            ) : (
              activeTypes.map((type) => <RoleBadgePill key={type} role={type} />)
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            Multi-select supported in top bar
          </span>
        </div>

        {/* Informative Testing Placeholder Card */}
        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Community Feed Viewport Ready
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The top header displays multiple-choice post-type selection pills on the left and the search input on the right. The left sidebar hosts Your Posts, Saved Posts, and Manage Your Posts. The right sidebar displays trending topics, recruiting drives, and guidelines.
          </p>
        </div>
      </div>
    </CommunityLayout>
  );
}
