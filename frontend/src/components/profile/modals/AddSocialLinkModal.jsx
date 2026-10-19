import React from 'react';
import { X, Globe } from 'lucide-react';

/**
 * AddSocialLinkModal Component
 * Modal for connecting social/learning profiles (LinkedIn, GitHub, Portfolio, LeetCode).
 */
export default function AddSocialLinkModal({ isOpen, onClose, onAdd }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Add Social Link</h3>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Platform</label>
            <select className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="LINKEDIN">LinkedIn</option>
              <option value="GITHUB">GitHub</option>
              <option value="PORTFOLIO">Portfolio Website</option>
              <option value="LEETCODE">LeetCode</option>
              <option value="KAGGLE">Kaggle</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Profile URL</label>
            <input
              type="url"
              placeholder="https://..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
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
            Save Link
          </button>
        </div>
      </div>
    </div>
  );
}
