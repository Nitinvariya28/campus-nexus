import React from 'react';
import { Link } from 'react-router-dom';
import CommunityLayout from '../../components/community/layout/CommunityLayout';
import { Bookmark, ArrowLeft } from 'lucide-react';
import CommunityFeedStream from '../../components/community/feed/CommunityFeedStream';

/**
 * SavedPostsPage Component
 * Displays the user's bookmarked posts, interview experiences, and opportunities.
 * Reuses CommunityFeedStream with isSaved={true} and direct LimitOffset pagination.
 */
export default function SavedPostsPage() {
  return (
    <CommunityLayout>
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        {/* Clean Header: Icon, Title & Back to Feed CTA */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Saved Posts</h1>
            </div>
          </div>
          <Link
            to="/community"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Feed</span>
          </Link>
        </div>

        {/* Saved Posts Feed Stream with Infinite Scroll */}
        <CommunityFeedStream
          isSaved={true}
          onResetFilters={() => {}}
        />
      </div>
    </CommunityLayout>
  );
}
