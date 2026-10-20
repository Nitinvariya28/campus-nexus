import React from 'react';
import { Bot, Sparkles, Clock, Target, Calendar } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';

/**
 * AIHabitsSection Component
 * Campus AI tool usage telemetry (Cursor, ChatGPT, Copilot, etc.).
 * Upgraded with modern interactive CustomSelect dropdowns.
 */
export default function AIHabitsSection({ formData, onChange, options }) {
  const tools = options?.ai_usage_form?.tools || [];
  const frequencies = options?.ai_usage_form?.frequencies || [];
  const purposes = options?.ai_usage_form?.purposes || [];
  const dailyTimeRanges = options?.ai_usage_form?.daily_time_ranges || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Campus AI Usage Habits</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* AI Tool */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Primary AI Tool
          </label>
          <CustomSelect
            name="ai_tool"
            value={formData?.ai_tool || ''}
            onChange={onChange}
            options={tools}
            placeholder="Select AI Tool..."
            icon={Sparkles}
          />
        </div>

        {/* Usage Frequency */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Usage Frequency
          </label>
          <CustomSelect
            name="usage_frequency"
            value={formData?.usage_frequency || ''}
            onChange={onChange}
            options={frequencies}
            placeholder="Select Frequency..."
            icon={Calendar}
          />
        </div>

        {/* Primary Purpose */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Primary Purpose
          </label>
          <CustomSelect
            name="usage_purpose"
            value={formData?.usage_purpose || ''}
            onChange={onChange}
            options={purposes}
            placeholder="Select Purpose..."
            icon={Target}
          />
        </div>

        {/* Daily Time Range */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Daily Time Range
          </label>
          <CustomSelect
            name="daily_time_range"
            value={formData?.daily_time_range || ''}
            onChange={onChange}
            options={dailyTimeRanges}
            placeholder="Select Duration..."
            icon={Clock}
          />
        </div>
      </div>
    </div>
  );
}
