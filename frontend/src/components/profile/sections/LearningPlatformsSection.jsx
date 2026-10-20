import React from 'react';
import { BookOpen, Plus, ExternalLink, X } from 'lucide-react';

/**
 * LearningPlatformsSection Component
 * Continuous learning platforms: YouTube, LeetCode, Coursera, GeeksforGeeks.
 * Strictly zero dummy data - displays user's real saved learning platforms or clean empty state.
 */
export default function LearningPlatformsSection({ platforms = [], onAddPlatform, onRemovePlatform }) {
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

      {platforms && platforms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map((lp, index) => {
            const name = lp.platform_name || lp.other_platform_name || 'Learning Platform';
            const initial = name ? name[0].toUpperCase() : 'L';
            const lpKey = lp.id || lp.platform_id || index;

            return (
              <div
                key={lpKey}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/60 transition"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                    {initial}
                  </span>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {name}
                    </span>
                    {lp.url ? (
                      <a
                        href={lp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                      >
                        {lp.url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-2xs text-slate-400">No URL provided</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePlatform && onRemovePlatform(lp.id || lp.platform_id || lp.url)}
                  className="text-slate-400 hover:text-red-600 p-1 rounded-sm hover:bg-slate-200 transition shrink-0 ml-2"
                  title={`Remove ${name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            No continuous learning resources linked yet. Click &apos;+ Add Resource&apos; to attach your active YouTube channels, LeetCode profiles, or Coursera certifications.
          </p>
        </div>
      )}
    </div>
  );
}
