import React, { useState } from 'react';
import { X, Mail, ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractErrorMessage, getFieldErrors } from '../../../utils/errorUtils';

/**
 * AlumniEmailModal Component
 * Modal for alumni personal email updates via 2-step OTP email verification.
 * Prevents invalid/unverified emails.
 */
export default function AlumniEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onRequestOTP,
  onVerifyOTP,
  onSubmit,
  isLoading = false,
}) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!newEmail.trim()) {
      newErrors.new_email = 'Enter your new email address.';
    }
    if (!password) {
      newErrors.password = 'Enter your account password.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onRequestOTP) {
      try {
        setIsSendingOtp(true);
        await onRequestOTP({ new_email: newEmail.trim(), password });
        setStep(2);
        toast.success(`Verification code sent to ${newEmail}`);
      } catch (err) {
        const fieldErrs = getFieldErrors(err);
        const generalMsg = extractErrorMessage(err, 'Failed to send verification code.');
        setErrors({ ...fieldErrs, general: generalMsg });
        toast.error(generalMsg);
      } finally {
        setIsSendingOtp(false);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!otpCode.trim()) {
      setErrors({ otp_code: 'Please enter the 6-digit verification code.' });
      return;
    }

    const verifyFn = onVerifyOTP || onSubmit;
    if (verifyFn) {
      try {
        await verifyFn(
          {
            new_email: newEmail.trim(),
            otp_code: otpCode.trim(),
          },
          () => {
            setNewEmail('');
            setPassword('');
            setOtpCode('');
            setStep(1);
            setErrors({});
            onClose();
          }
        );
      } catch (err) {
        const fieldErrs = getFieldErrors(err);
        const generalMsg = extractErrorMessage(err, 'Failed to verify code.');
        setErrors({ ...fieldErrs, general: generalMsg });
        toast.error(generalMsg);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Update Personal Email</h3>
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

        {step === 1 ? (
          /* Step 1: Input new email & password */
          <form onSubmit={handleRequestOtp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Email</label>
              <input
                type="email"
                disabled
                value={currentEmail || ''}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (errors.new_email) setErrors((prev) => ({ ...prev, new_email: '' }));
                }}
                placeholder="new.email@example.com"
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                  errors.new_email ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                }`}
              />
              {errors.new_email && (
                <p className="text-2xs text-red-600 mt-1 font-medium">{errors.new_email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Password (Verification)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Enter current password"
                  className={`w-full bg-white border rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 ${
                    errors.password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-2xs text-red-600 mt-1 font-medium">{errors.password}</p>
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
                disabled={isSendingOtp}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-xs transition flex items-center gap-1.5"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Input 6-digit OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Verification code sent</span>
              </div>
              <p className="text-2xs text-blue-800">
                Enter the 6-digit verification code sent to <strong>{newEmail}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                6-Digit Verification Code (OTP)
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  if (errors.otp_code) setErrors((prev) => ({ ...prev, otp_code: '' }));
                }}
                placeholder="123456"
                className={`w-full bg-white border rounded-lg px-3.5 py-2 text-center font-mono text-lg tracking-widest text-slate-900 focus:outline-none focus:ring-2 ${
                  errors.otp_code ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                }`}
              />
              {errors.otp_code && (
                <p className="text-2xs text-red-600 mt-1 font-medium text-center">{errors.otp_code}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-xs transition flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Verify & Update Email'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
