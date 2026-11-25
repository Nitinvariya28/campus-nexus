import React from 'react';
import { Bot, RotateCcw, Sparkles } from 'lucide-react';

/**
 * ChatHeader Component
 * Clean, modern header with topic filter pills and clear button.
 */
export default function ChatHeader({
  activeCategory,
  onSelectCategory,
  onClearChat,
  messageCount,
}) {
  const categories = [
    { id: 'ALL', label: 'All Topics' },
    { id: 'PLACEMENT_CELL', label: 'Placement Cell' },
    { id: 'NIRMA', label: 'Nirma Regulations' },
    { id: 'INTERVIEW_PREP', label: 'Interview Prep' },
    { id: 'INDUSTRY_TECH', label: 'Tech Stack' },
  ];

  return (
    <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-4xl mx-auto">
        {/* Title and Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                AlumiBridge Campus Assistant
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Online</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Grounded in Nirma University regulations, placement cell policies, and interview guides
            </p>
          </div>
        </div>

        {/* Right Action: Clear Chat */}
        {messageCount > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200/80 transition-colors cursor-pointer self-start sm:self-center shrink-0"
            title="Clear chat history"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear conversation</span>
          </button>
        )}
      </div>

      {/* Category Pills Row */}
      <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar max-w-4xl mx-auto">
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
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
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
