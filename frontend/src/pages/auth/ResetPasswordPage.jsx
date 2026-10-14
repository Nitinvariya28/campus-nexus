import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract reset_token and email passed from VerifyOtpPage
  const resetToken = location.state?.reset_token || '';
  const email = location.state?.email || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: '',
  });

  const handleChange = (e) => {
    if (apiError) setApiError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      toast.error('No reset token available. Please verify OTP first.');
      return;
    }

    if (formData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      // Endpoint: POST /api/auth/password-reset/confirm/
      const res = await authService.confirmPasswordReset({
        reset_token: resetToken,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });

      toast.success(res.message || 'Password updated successfully! Please log in.');

      // Redirect to /login with email preloaded
      navigate('/login', {
        state: { email },
      });
    } catch (err) {
      const errorMsg = authService.parseApiError(err);
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      flipped={false}
      badgeText="Credential Lock"
      headline="Lock in Your New Credentials"
      description="Your new password is encrypted instantly. After updating, all previous sessions are invalidated to guarantee security."
      bullets={[
        "Single-use cryptographic reset token verification",
        "Tokens burned permanently upon password change",
        "Seamless synchronization across web and mobile"
      ]}
      gradientFrom="from-[#2E1065]"
      gradientVia="via-[#4C1D95]"
      gradientTo="to-[#0F172A]"
      accentColor="text-purple-400"
    >
      <div className="space-y-6">
        <div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Set new password
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Choose a strong password to protect your campus account
          </p>
        </div>

        {/* Security Warning if reset_token is missing (Direct URL Access) */}
        {!resetToken && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Missing or expired reset session.
            </p>
            <p className="text-amber-700">
              For security, you must enter a verified 6-digit OTP code before changing your password.
            </p>
            <div className="pt-1">
              <Link
                to="/forgot-password"
                className="font-bold underline text-amber-900 hover:text-amber-950 inline-flex items-center gap-1"
              >
                <span>← Request New Recovery Code</span>
              </Link>
            </div>
          </div>
        )}

        {/* API Error Alert Banner */}
        {apiError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Password update failed</p>
              <p className="text-red-600 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                disabled={isLoading || !resetToken}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all placeholder:text-slate-400 pr-10 disabled:bg-slate-50 disabled:cursor-not-allowed"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading || !resetToken}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Must be at least 8 characters long.
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                disabled={isLoading || !resetToken}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all placeholder:text-slate-400 pr-10 disabled:bg-slate-50 disabled:cursor-not-allowed"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={isLoading || !resetToken}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                aria-label="Toggle password visibility"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading || !resetToken}
            className={`w-full mt-2 text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
              isLoading || !resetToken
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 transform active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Securing new password...</span>
              </>
            ) : (
              <>
                <span>Update Password & Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
