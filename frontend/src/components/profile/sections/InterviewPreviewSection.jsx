import React from 'react';
import { Award, Layers, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * InterviewPreviewSection Component
 * Read-only summary preview of interview experiences contributed by this alumni user.
 */
export default function InterviewPreviewSection({ experiences }) {
  const sampleExp = experiences && experiences.length > 0 ? experiences[0] : {
    company_name: 'Microsoft',
    role_name: 'Senior Cloud Solutions Architect',
    experience_type: 'CAMPUS_PLACEMENT',
    result: 'SELECTED',
    difficulty: 'HARD',
    rounds: [
      { id: 1, round_type: 'ONLINE_ASSESSMENT' },
      { id: 2, round_type: 'TECHNICAL' },
      { id: 3, round_type: 'TECHNICAL' },
      { id: 4, round_type: 'SYSTEM_DESIGN' },
    ],
  };

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

      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-900 text-sm">
              {sampleExp.company_name}
            </span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-xs text-slate-600">{sampleExp.role_name}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {sampleExp.result}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            {sampleExp.rounds?.length || 4} Rounds
          </span>
          <span>•</span>
          <span>Difficulty: <strong className="text-slate-700">{sampleExp.difficulty}</strong></span>
        </div>
      </div>
    </div>
  );
}
