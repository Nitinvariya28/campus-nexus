import React from 'react';
import { BookOpen, Plus, ExternalLink, X } from 'lucide-react';

/**
 * LearningPlatformsSection Component
 * Continuous learning platforms: YouTube, LeetCode, Coursera, GeeksforGeeks.
 */
export default function LearningPlatformsSection({ platforms, onAddPlatform, onRemovePlatform }) {
  const samplePlatforms = platforms && platforms.length > 0 ? platforms : [
    { id: 1, platform_name: 'YouTube', url: 'https://youtube.com/@mitocw', platform_type: 'YOUTUBE_CHANNEL' },
    { id: 2, platform_name: 'LeetCode', url: 'https://leetcode.com/aarav_patel', platform_type: 'CODING_PLATFORM' },
    { id: 3, platform_name: 'Coursera', url: 'https://coursera.org/specializations/deep-learning', platform_type: 'COURSE_WEBSITE' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Continuous Learning & Resources</h2>
        </div>
        <button
          type="button"
          onClick={onAddPlatform}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Resource
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {samplePlatforms.map((lp) => (
          <div
            key={lp.id}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/60 transition"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                {lp.platform_name[0]}
              </span>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {lp.platform_name}
                </span>
                <a
                  href={lp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-2xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                >
                  {lp.url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemovePlatform && onRemovePlatform(lp.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-sm hover:bg-slate-200 transition shrink-0 ml-2"
              title="Remove resource"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
