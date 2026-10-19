import React from 'react';
import { X, Sparkles } from 'lucide-react';

/**
 * AddSkillModal Component
 * Searchable skill selection modal with proficiency picker (Beginner, Intermediate, Advanced).
 */
export default function AddSkillModal({ isOpen, onClose, onAdd }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Add Technical Skill</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Skill</label>
            <select className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="1">Python</option>
              <option value="2">React.js</option>
              <option value="3">Node.js</option>
              <option value="4">Docker</option>
              <option value="5">Kubernetes</option>
              <option value="6">AWS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Proficiency Level</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className="py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 transition"
              >
                Beginner
              </button>
              <button
                type="button"
                className="py-2 text-xs font-semibold rounded-lg border border-blue-500 bg-blue-50 text-blue-700 shadow-xs transition"
              >
                Intermediate
              </button>
              <button
                type="button"
                className="py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 transition"
              >
                Advanced
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onAdd && onAdd()}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition"
          >
            Add to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
