import React, { useState } from 'react';
import { KeyRound, Mail, AlertTriangle, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractErrorMessage, getFieldErrors } from '../../../utils/errorUtils';

/**
 * SecuritySection Component
 * Dedicated security management:
 * 1. Password change with eye icon toggle, validation, and real error display.
 * 2. Alumni email update with 2-step OTP email verification.
 * 3. Danger Zone account deletion.
 */
export default function SecuritySection({
  userRole,
  userEmail,
  isChangingPassword = false,
  isChangingEmail = false,
  onChangePassword,
  onRequestEmailOTP,
  onChangeEmail,
  onDeleteAccount,
}) {
  const isStudent = userRole === 'STUDENT';
  const isAlumni = userRole === 'ALUMNI';

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Alumni email change state
  const [emailForm, setEmailForm] = useState({
    new_email: '',
    password: '',
    otp_code: '',
  });
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailStep, setEmailStep] = useState(1); // 1 = Enter Email & Password, 2 = Enter OTP
  const [emailErrors, setEmailErrors] = useState({});
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});

    const errors = {};
    if (!passwordForm.current_password) {
      errors.current_password = 'Enter your current password.';
    }
    if (!passwordForm.new_password) {
      errors.new_password = 'Enter a new password.';
    } else if (passwordForm.new_password.length < 8) {
      errors.new_password = 'New password must be at least 8 characters long.';
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errors.confirm_password = 'New passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    if (onChangePassword) {
      try {
        await onChangePassword(passwordForm, () => {
          setPasswordForm({
            current_password: '',
            new_password: '',
            confirm_password: '',
          });
          setPasswordErrors({});
        });
      } catch (err) {
        const fieldErrs = getFieldErrors(err);
        const generalMsg = extractErrorMessage(err, 'Failed to update password.');
        setPasswordErrors({ ...fieldErrs, general: generalMsg });
      }
    }
  };

  const handleRequestOtpSubmit = async (e) => {
    e.preventDefault();
    setEmailErrors({});

    const errors = {};
    if (!emailForm.new_email.trim()) {
      errors.new_email = 'Enter your new email address.';
    }
    if (!emailForm.password) {
      errors.password = 'Enter your current account password to verify identity.';
    }

    if (Object.keys(errors).length > 0) {
      setEmailErrors(errors);
      return;
    }

    if (onRequestEmailOTP) {
      try {
        setIsSendingOtp(true);
        await onRequestEmailOTP({
          new_email: emailForm.new_email.trim(),
          password: emailForm.password,
        });
        setEmailStep(2);
        toast.success(`Verification code sent to ${emailForm.new_email}`);
      } catch (err) {
        const fieldErrs = getFieldErrors(err);
        const generalMsg = extractErrorMessage(err, 'Failed to send verification code.');
        setEmailErrors({ ...fieldErrs, general: generalMsg });
        toast.error(generalMsg);
      } finally {
        setIsSendingOtp(false);
      }
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setEmailErrors({});

    if (!emailForm.otp_code.trim()) {
      setEmailErrors({ otp_code: 'Please enter the 6-digit verification code.' });
      return;
    }

    if (onChangeEmail) {
      try {
        await onChangeEmail(
          {
            new_email: emailForm.new_email.trim(),
            otp_code: emailForm.otp_code.trim(),
          },
          () => {
            setEmailForm({ new_email: '', password: '', otp_code: '' });
            setEmailStep(1);
            setEmailErrors({});
          }
        );
      } catch (err) {
        const fieldErrs = getFieldErrors(err);
        const generalMsg = extractErrorMessage(err, 'Failed to verify code.');
        setEmailErrors({ ...fieldErrs, general: generalMsg });
        toast.error(generalMsg);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Grid: Password & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Card 1: Change Password */}
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
                <p className="text-2xs text-slate-500">Keep your account secure with a strong password.</p>
              </div>
            </div>

            {passwordErrors.general && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {passwordErrors.general}
              </div>
            )}

            <div className="space-y-3">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }));
                      if (passwordErrors.current_password) setPasswordErrors((prev) => ({ ...prev, current_password: '' }));
                    }}
                    placeholder="••••••••••••"
                    className={`w-full bg-white border rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                      passwordErrors.current_password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
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
                {passwordErrors.current_password && (
                  <p className="text-2xs text-red-600 mt-1 font-medium">{passwordErrors.current_password}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }));
                      if (passwordErrors.new_password) setPasswordErrors((prev) => ({ ...prev, new_password: '' }));
                    }}
                    placeholder="Minimum 8 characters"
                    className={`w-full bg-white border rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                      passwordErrors.new_password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
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
                {passwordErrors.new_password && (
                  <p className="text-2xs text-red-600 mt-1 font-medium">{passwordErrors.new_password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirm_password}
                    onChange={(e) => {
                      setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }));
                      if (passwordErrors.confirm_password) setPasswordErrors((prev) => ({ ...prev, confirm_password: '' }));
                    }}
                    placeholder="Confirm new password"
                    className={`w-full bg-white border rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                      passwordErrors.confirm_password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
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
                {passwordErrors.confirm_password && (
                  <p className="text-2xs text-red-600 mt-1 font-medium">{passwordErrors.confirm_password}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full mt-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
              </>
            ) : (
              'Change Password'
            )}
          </button>
        </form>

        {/* Card 2: Email Settings (Role-Adaptive) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">Email Settings</h2>
              <p className="text-2xs text-slate-500">
                {isAlumni ? 'Verified personal email update via email OTP.' : 'Official institutional email configuration.'}
              </p>
            </div>
          </div>

          {emailErrors.general && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {emailErrors.general}
            </div>
          )}

          {isAlumni ? (
            emailStep === 1 ? (
              /* Step 1: Enter New Email & Current Password */
              <form onSubmit={handleRequestOtpSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Current Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userEmail || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    New Personal Email Address
                  </label>
                  <input
                    type="email"
                    value={emailForm.new_email}
                    onChange={(e) => {
                      setEmailForm((prev) => ({ ...prev, new_email: e.target.value }));
                      if (emailErrors.new_email) setEmailErrors((prev) => ({ ...prev, new_email: '' }));
                    }}
                    placeholder="new.email@example.com"
                    className={`w-full bg-white border rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                      emailErrors.new_email ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                    }`}
                  />
                  {emailErrors.new_email && (
                    <p className="text-2xs text-red-600 mt-1 font-medium">{emailErrors.new_email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Account Password (Verification)
                  </label>
                  <div className="relative">
                    <input
                      type={showEmailPassword ? 'text' : 'password'}
                      value={emailForm.password}
                      onChange={(e) => {
                        setEmailForm((prev) => ({ ...prev, password: e.target.value }));
                        if (emailErrors.password) setEmailErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      placeholder="Enter current password"
                      className={`w-full bg-white border rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                        emailErrors.password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                      title={showEmailPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {emailErrors.password && (
                    <p className="text-2xs text-red-600 mt-1 font-medium">{emailErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full mt-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Verification Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Enter 6-digit OTP code sent to the new email */
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Check your new email inbox</span>
                  </div>
                  <p className="text-2xs text-blue-800">
                    We sent a 6-digit verification code to <strong>{emailForm.new_email}</strong>.
                    Enter it below to confirm and change your email.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    6-Digit Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailForm.otp_code}
                    onChange={(e) => {
                      setEmailForm((prev) => ({ ...prev, otp_code: e.target.value }));
                      if (emailErrors.otp_code) setEmailErrors((prev) => ({ ...prev, otp_code: '' }));
                    }}
                    placeholder="123456"
                    className={`w-full bg-white border rounded-lg px-3.5 py-2 text-center font-mono text-lg tracking-widest text-slate-900 focus:outline-none focus:ring-2 ${
                      emailErrors.otp_code ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'
                    }`}
                  />
                  {emailErrors.otp_code && (
                    <p className="text-2xs text-red-600 mt-1 font-medium text-center">{emailErrors.otp_code}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailStep(1)}
                    className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingEmail}
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2"
                  >
                    {isChangingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                      </>
                    ) : (
                      'Verify & Update'
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>{userEmail || 'Institutional Email'}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isStudent
                  ? 'Your university email is permanently locked to your student roll number by institutional university policy.'
                  : 'Institutional Placement Cell administrative accounts are centrally managed and locked.'}
              </p>
              <span className="inline-block px-2.5 py-1 rounded-md text-2xs font-semibold bg-slate-200/70 text-slate-700">
                Institutional Managed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Danger Zone */}
      <div className="bg-red-50/60 border border-red-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900">Danger Zone: Delete Account</h3>
            <p className="text-xs text-red-700/90 mt-0.5 max-w-2xl leading-relaxed">
              This will permanently anonymize your account and delete private files. Your placement records and
              contributions will be retained anonymously for institutional analytics as &quot;Deleted User&quot;.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDeleteAccount}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition shadow-xs whitespace-nowrap self-start sm:self-center"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
