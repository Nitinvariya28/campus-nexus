import React from 'react';
import { Trash2, Clock, MapPin, Laptop, BookOpen } from 'lucide-react';

const DEFAULT_ROUND_TYPES = [
  { value: 'ONLINE_ASSESSMENT', label: 'Online Assessment (OA)' },
  { value: 'TECHNICAL', label: 'Technical Interview' },
  { value: 'CODING', label: 'Live Coding' },
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'HR', label: 'HR / Behavioral' },
  { value: 'MANAGERIAL', label: 'Managerial' },
  { value: 'GROUP_DISCUSSION', label: 'Group Discussion' },
  { value: 'OTHER', label: 'Other Round' },
];

const DEFAULT_ROUND_MODES = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'In-Person (Offline)' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'NOT_SPECIFIED', label: 'Not Specified' },
];

/**
 * RoundDetailRow
 * Sub-form editor for individual interview rounds within InterviewExperienceForm.
 */
export default function RoundDetailRow({
  round,
  index,
  totalRounds,
  onChange,
  onRemove,
  roundTypes = DEFAULT_ROUND_TYPES,
  roundModes = DEFAULT_ROUND_MODES,
  errors = {},
}) {
  const handleChange = (field, value) => {
    onChange?.({
      ...round,
      [field]: value,
    });
  };

  const currentTypes = roundTypes.length > 0 ? roundTypes : DEFAULT_ROUND_TYPES;
  const currentModes = roundModes.length > 0 ? roundModes : DEFAULT_ROUND_MODES;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-2xs flex items-center justify-center">
            {round.round_number || index + 1}
          </span>
          <h4 className="text-xs font-bold text-slate-800">
            Round {round.round_number || index + 1} Configuration
          </h4>
        </div>

        {totalRounds > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
            title="Remove this round"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Row 1: Type, Mode, Duration */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Round Type */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Round Type <span className="text-red-500">*</span>
          </label>
          <select
            value={round.round_type || 'ONLINE_ASSESSMENT'}
            onChange={(e) => handleChange('round_type', e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
          >
            {currentTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mode */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Delivery Mode <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1 flex-wrap">
            {currentModes.map((m) => {
              const isSelected = (round.mode || 'ONLINE') === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleChange('mode', m.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border text-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration in Minutes */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Duration (Min)</span>
          </label>
          <input
            type="number"
            min="10"
            max="300"
            value={round.duration_minutes || 45}
            onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 text-slate-800 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Row 2: Topics */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Key Topics Covered (Comma-separated) <span className="text-red-500">*</span></span>
        </label>
        <input
          type="text"
          value={round.topics || ''}
          onChange={(e) => handleChange('topics', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          placeholder="e.g. Data Structures, Graph BFS, React State, System Design"
          className={`w-full text-xs rounded-lg border bg-white p-2 text-slate-800 focus:outline-hidden focus:ring-1 ${
            errors.topics
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
          }`}
        />
        {errors.topics && (
          <p className="text-2xs text-red-600 font-medium">{errors.topics}</p>
        )}
      </div>

      {/* Row 3: Description / Questions asked */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            Round Experience & Questions Asked <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-slate-400 font-mono">{(round.description || '').length} characters</span>
        </div>
        <textarea
          rows={3}
          value={round.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe how the interviewer started, specific questions asked, edge cases tested (min 10 characters)..."
          className={`w-full text-xs rounded-lg border bg-white p-2.5 text-slate-800 focus:outline-hidden focus:ring-1 resize-y leading-relaxed ${
            errors.description
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-300 focus:border-blue-600 focus:ring-blue-500'
          }`}
        />
        {errors.description && (
          <p className="text-2xs text-red-600 font-medium">{errors.description}</p>
        )}
      </div>
    </div>
  );
}
