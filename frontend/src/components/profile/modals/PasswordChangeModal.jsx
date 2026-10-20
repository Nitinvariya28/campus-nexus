import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractErrorMessage, getFieldErrors } from '../../../utils/errorUtils';

/**
 * PasswordChangeModal Component
 * Interactive modal for updating password credentials.
 * Features eye toggles for password visibility and field-level error messages.
 */
export default function PasswordChangeModal({ isOpen, onClose, onSubmit, isLoading = false }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!currentPassword) {
      newErrors.current_password = 'Enter your current password.';
    }
    if (!newPassword) {
      newErrors.new_password = 'Enter a new password.';
    } else if (newPassword.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters long.';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirm_password = 'New passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit(
          {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          },
          () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setErrors({});
            onClose();
          }
        );
      } catch (err) {
        const fieldErrs = getFieldErrors(err);
        const generalMsg = extractErrorMessage(err, 'Failed to update password.');
        setErrors({ ...fieldErrs, general: generalMsg });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errors.general && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.current_password) setErrors((prev) => ({ ...prev, current_password: '' }));
                }}
                placeholder="••••••••••••"
                className={`w-full bg-white border rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.current_password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.current_password && (
              <p className="text-2xs text-red-600 mt-1 font-medium">{errors.current_password}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.new_password) setErrors((prev) => ({ ...prev, new_password: '' }));
                }}
                placeholder="Minimum 8 characters"
                className={`w-full bg-white border rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.new_password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-2xs text-red-600 mt-1 font-medium">{errors.new_password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirm_password) setErrors((prev) => ({ ...prev, confirm_password: '' }));
                }}
                placeholder="Confirm new password"
                className={`w-full bg-white border rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.confirm_password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-2xs text-red-600 mt-1 font-medium">{errors.confirm_password}</p>
            )}
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
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-xs transition flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
