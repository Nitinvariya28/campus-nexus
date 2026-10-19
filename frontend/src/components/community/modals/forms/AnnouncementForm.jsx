import React, { useState } from 'react';
import {
  Calendar,
  Send,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';

const ANNOUNCEMENT_TYPES = [
  { value: 'PLACEMENT', label: 'Placement Update' },
  { value: 'INTERNSHIP', label: 'Internship Drive' },
  { value: 'TRAINING', label: 'Training Session' },
  { value: 'EVENT', label: 'Campus Event' },
  { value: 'DOCUMENT', label: 'Official Document / Form' },
  { value: 'GENERAL', label: 'General Notice' },
];

const TARGET_AUDIENCES = [
  { value: 'ALL', label: 'All Students' },
  { value: 'STUDENTS', label: 'Students Only' },
  { value: 'ALUMNI', label: 'Alumni Network' },
  { value: 'PLACEMENT_CELL', label: 'Placement Cell' },
];

/**
 * AnnouncementForm
 * Official notice broadcaster for Placement Cell administrators.
 * Direct database choice mapping and standard compact UI.
 */
export default function AnnouncementForm({
  options,
  onSubmit,
  isSubmitting,
  submitError,
  initialData = null,
  mode = 'create',
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [announcementType, setAnnouncementType] = useState(initialData?.announcement_type || 'PLACEMENT');
  const [targetAudience, setTargetAudience] = useState(initialData?.target_audience || 'ALL');
  const [deadline, setDeadline] = useState(initialData?.deadline ? initialData.deadline.slice(0, 16) : '');
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!title.trim()) errors.title = 'Announcement headline is required.';
    if (!content.trim() || content.trim().length < 10) {
      errors.content = 'Announcement content must be at least 10 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    let formattedDeadline = null;
    if (deadline) {
      try {
        formattedDeadline = new Date(deadline).toISOString();
      } catch {
        formattedDeadline = deadline;
      }
    }

    const payload = {
      entity_type: 'ANNOUNCEMENT',
      title: title.trim(),
      content: content.trim(),
      announcement_type: announcementType,
      target_audience: targetAudience,
      deadline: formattedDeadline,
      is_published: true,
    };

    onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
      className="space-y-5"
    >
      {submitError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{typeof submitError === 'string' ? submitError : 'Failed to broadcast announcement.'}</span>
        </div>
      )}

      {/* 1. Announcement Classification Pills */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          Notice Classification <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {ANNOUNCEMENT_TYPES.map((t) => {
            const isSelected = announcementType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setAnnouncementType(t.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 font-semibold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{t.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Target Audience Pills */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          Target Audience
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {TARGET_AUDIENCES.map((aud) => {
            const isSelected = targetAudience === aud.value;
            return (
              <button
                key={aud.value}
                type="button"
                onClick={() => setTargetAudience(aud.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {aud.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Headline & Deadline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Notice Headline <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Schedule Update: Oracle Online Assessment shifted to 24th Oct"
            className={`w-full text-sm rounded-lg border p-2.5 bg-white text-slate-900 focus:outline-hidden focus:ring-2 shadow-2xs ${
              validationErrors.title
                ? 'border-red-400 focus:ring-red-200'
                : 'border-slate-300 focus:ring-purple-500/20 focus:border-purple-600'
            }`}
          />
          {validationErrors.title && (
            <p className="text-2xs text-red-600 font-medium">{validationErrors.title}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Action Deadline</span>
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 4. Notice Body */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          Announcement Guidelines & Content <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Draft official instructions, registration schedule, exam guidelines, or policy changes..."
          className={`w-full text-sm rounded-lg border p-3 bg-white text-slate-900 focus:outline-hidden focus:ring-2 shadow-2xs leading-relaxed ${
            validationErrors.content
              ? 'border-red-400 focus:ring-red-200'
              : 'border-slate-300 focus:ring-purple-500/20 focus:border-purple-600'
          }`}
        />
        {validationErrors.content && (
          <p className="text-2xs text-red-600 font-medium">{validationErrors.content}</p>
        )}
      </div>

      {/* Submit CTA */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{mode === 'edit' ? 'Saving Changes...' : 'Broadcasting...'}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{mode === 'edit' ? 'Save Changes' : 'Broadcast Announcement'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
