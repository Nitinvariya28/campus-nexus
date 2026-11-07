import React from 'react';
import { GraduationCap, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import RecommendationCard from './RecommendationCard';

/**
 * StudentRecommendations Component
 * Displays top 5 recommended student profiles with independent pagination.
 */
export default function StudentRecommendations({
  data,
  isLoading,
  page,
  onPageChange,
}) {
  const items = data?.items || [];
  const totalPages = data?.total_pages || 1;
  const totalCount = data?.total_count || 0;
  const hasPrevious = data?.has_previous ?? page > 1;
  const hasNext = data?.has_next ?? page < totalPages;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Recommended Students</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Top 5
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Peers with matching academic departments and technical skill sets
            </p>
          </div>
        </div>

        {/* Count Summary */}
        {totalCount > 0 && (
          <div className="text-xs text-slate-500 self-start sm:self-auto">
            <span>Total: </span>
            <strong className="text-slate-800 font-semibold">{totalCount}</strong> candidates
          </div>
        )}
      </div>

      {/* Content Body */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Computing student recommendations...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs sm:text-sm font-semibold text-slate-800">No Student Recommendations Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add more technical skills or courses to your profile to discover aligned students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((student) => (
            <RecommendationCard key={student.id || student.user_id} profile={student} />
          ))}
        </div>
      )}

      {/* Independent Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-slate-500">
            Page <strong className="text-slate-800">{page}</strong> of{' '}
            <strong className="text-slate-800">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPrevious || isLoading}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={!hasNext || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
