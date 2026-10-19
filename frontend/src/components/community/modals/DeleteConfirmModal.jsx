import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

/**
 * DeleteConfirmModal Component
 * Confirmation modal for deleting posts, opportunities, interview breakdowns, or announcements.
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  postTitle = '',
  errorMessage = null,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="text-base font-bold text-slate-900">Delete Post?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete this post? This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Post Preview Card */}
        {postTitle && (
          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-700 font-medium truncate">
            "{postTitle}"
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
