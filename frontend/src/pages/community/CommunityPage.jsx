import React from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import CommunityLayout from '../../components/community/layout/CommunityLayout';
import { Rss, FileText, Settings, Plus, CheckCircle2, Filter, ArrowLeft } from 'lucide-react';
import RoleBadgePill from '../../components/community/common/RoleBadgePill';
import CommunityFeedStream from '../../components/community/feed/CommunityFeedStream';

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
  const [searchParams, setSearchParams] = useSearchParams();

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

          {/* Author Feed Stream */}
          <CommunityFeedStream
            authorId="me"
            onResetFilters={() => {}}
          />
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
      <CommunityFeedStream
        roles={activeTypes}
        onResetFilters={() => {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('types');
          setSearchParams(nextParams);
        }}
      />
    </CommunityLayout>
  );
}
