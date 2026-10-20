import React from 'react';
import { Award, Layers, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * InterviewPreviewSection Component
 * Read-only summary preview of interview experiences contributed by this alumni user.
 * Strictly zero dummy data - shows real authored reviews or clean empty prompt.
 */
export default function InterviewPreviewSection({ experiences = [] }) {
  const hasExperiences = experiences && experiences.length > 0;
  const topExp = hasExperiences ? experiences[0] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-semibold text-slate-900">Authored Interview Guides</h2>
        </div>
        <Link
          to="/community/my-posts"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View in Community <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {hasExperiences && topExp ? (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 text-sm">
                {topExp.company_name || 'Hiring Company'}
              </span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="text-xs text-slate-600">{topExp.role_name || 'Designation'}</span>
            </div>
            {topExp.result && (
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {topExp.result}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            {topExp.rounds && (
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {topExp.rounds.length} Round{topExp.rounds.length !== 1 ? 's' : ''}
              </span>
            )}
            {topExp.difficulty && (
              <>
                <span>•</span>
                <span>Difficulty: <strong className="text-slate-700">{topExp.difficulty}</strong></span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-xs text-slate-500 mb-2">
            You haven&apos;t shared an interview preparation guide yet.
          </p>
          <Link
            to="/community/create"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Contribute an Interview Experience <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
