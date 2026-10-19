import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * DeleteAccountModal Component
 * Enterprise double-confirmation modal requiring user to type "DELETE" before soft-deletion.
 */
export default function DeleteAccountModal({ isOpen, onClose, onConfirm }) {
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim().toUpperCase() === 'DELETE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-red-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-red-950">Delete Account Confirmation</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-900">
            Are you sure you want to permanently delete your AlumiBridge account?
          </p>
          <p>
            Your login credentials and private resumes will be permanently deleted. Your academic placement trajectory
            and community interview guides will be safely retained for university analytics under{' '}
            <strong className="text-slate-800">&quot;Deleted User&quot;</strong>.
          </p>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-red-800">
            Please type <strong className="font-mono font-bold text-red-900">DELETE</strong> to confirm this action:
          </div>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder='Type "DELETE" here'
            className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
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
            disabled={!isConfirmed}
            onClick={() => onConfirm && onConfirm(confirmInput)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition ${
              isConfirmed
                ? 'bg-red-600 hover:bg-red-700 shadow-xs cursor-pointer'
                : 'bg-red-300 cursor-not-allowed'
            }`}
          >
            Permanently Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
