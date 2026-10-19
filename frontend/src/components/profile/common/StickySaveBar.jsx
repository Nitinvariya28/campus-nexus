import React from 'react';
import { Save, RotateCcw } from 'lucide-react';

/**
 * StickySaveBar Component
 * Floating action banner triggered when form has unsaved modifications.
 */
export default function StickySaveBar({ isDirty, isSaving, onSave, onDiscard }) {
  if (!isDirty) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 px-6 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        <div>
          <span className="text-xs sm:text-sm font-semibold block text-slate-100">
            You have unsaved profile changes
          </span>
          <span className="text-2xs text-slate-400 hidden sm:block">
            Don&apos;t forget to save before navigating away.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
