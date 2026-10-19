import React from 'react';
import { Bot, Edit3 } from 'lucide-react';

/**
 * AIHabitsSection Component
 * Campus AI tool usage telemetry (Cursor, ChatGPT, Copilot, etc.).
 */
export default function AIHabitsSection({ formData, onChange }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Campus AI Usage Habits</h2>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* AI Tool */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Primary AI Tool
          </label>
          <select
            name="ai_tool"
            defaultValue={formData?.ai_tool || 'CURSOR'}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="CURSOR">Cursor</option>
            <option value="CHATGPT">ChatGPT</option>
            <option value="GITHUB_COPILOT">GitHub Copilot</option>
            <option value="CLAUDE">Claude</option>
            <option value="GEMINI">Gemini</option>
          </select>
        </div>

        {/* Usage Frequency */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Usage Frequency
          </label>
          <select
            name="usage_frequency"
            defaultValue={formData?.usage_frequency || 'REGULARLY'}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="REGULARLY">Regularly</option>
            <option value="HEAVILY">Heavily (Daily)</option>
            <option value="OCCASIONALLY">Occasionally</option>
            <option value="NEVER">Never</option>
          </select>
        </div>

        {/* Primary Purpose */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Primary Purpose
          </label>
          <select
            name="usage_purpose"
            defaultValue={formData?.usage_purpose || 'CODING'}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="CODING">Coding & Development</option>
            <option value="DEBUGGING">Debugging</option>
            <option value="LEARNING">Learning & Concepts</option>
            <option value="RESEARCH">Research</option>
          </select>
        </div>

        {/* Daily Time Range */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Daily Time Range
          </label>
          <select
            name="daily_time_range"
            defaultValue={formData?.daily_time_range || '1_TO_2_HOURS'}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="LESS_THAN_30_MIN">&lt; 30 min</option>
            <option value="30_TO_60_MIN">30 - 60 min</option>
            <option value="1_TO_2_HOURS">1 - 2 hours</option>
            <option value="2_TO_4_HOURS">2 - 4 hours</option>
            <option value="MORE_THAN_4_HOURS">&gt; 4 hours</option>
          </select>
        </div>
      </div>
    </div>
  );
}
