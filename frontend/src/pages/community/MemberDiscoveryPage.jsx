import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import CommunityLayout from '../../components/community/layout/CommunityLayout';
import { Compass, CheckCircle2, Search, ArrowLeft } from 'lucide-react';

/**
 * MemberDiscoveryPage Component
 * Senior & Alumni Profile Discovery / Search Route (/community/discover).
 * Displayed when user searches members from top search bar.
 */
export default function MemberDiscoveryPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  return (
    <CommunityLayout>
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        {/* Page Identity Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Member Discovery</h1>
              <p className="text-xs text-slate-500">
                Route: /community/discover · Alumni &amp; Senior Search Directory
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
              <span>Search View Active</span>
            </span>
          </div>
        </div>

        {/* Active Search Query Feedback */}
        {query ? (
          <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center gap-2 text-xs text-blue-900">
            <Search className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Searching verified members matching:{' '}
              <span className="font-bold">"{query}"</span>
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Type a name or topic in the top search bar to find members and alumni.
            </span>
          </div>
        )}

        {/* Informative Testing Placeholder Card */}
        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Member Search &amp; Discovery Viewport
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This viewport orchestrates skill-based alumni and senior discovery, external LinkedIn/GitHub links, and connection requests triggered when users search via the top header.
          </p>
        </div>
      </div>
    </CommunityLayout>
  );
}
