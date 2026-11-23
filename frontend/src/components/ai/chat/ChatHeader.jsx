import React from 'react';
import { Bot, Sparkles, RotateCcw, ShieldCheck } from 'lucide-react';

/**
 * ChatHeader Component
 * Clean, modern header with category pills and conversation reset.
 */
export default function ChatHeader({
  activeCategory,
  onSelectCategory,
  onClearChat,
  messageCount,
}) {
  const categories = [
    { id: 'ALL', label: 'All Knowledge' },
    { id: 'PLACEMENT_CELL', label: 'Placement Cell' },
    { id: 'NIRMA', label: 'Nirma University' },
    { id: 'INTERVIEW_PREP', label: 'Interview Prep' },
    { id: 'INDUSTRY_TECH', label: 'Industry Tech' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
      {/* Top Row: Title + Status + Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                AlumiBridge Campus Assistant
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Official Nirma University regulations, placement policies, and technical interview guidelines
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {messageCount > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50/50 shadow-2xs transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Verified Knowledge</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Category Filter Pills */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Filter:
        </span>
        <div className="flex items-center gap-1.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
