import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { KeyRound, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitizedEmail = email.trim().toLowerCase();
    setApiError('');
    setFieldError('');

    if (!sanitizedEmail) {
      setFieldError('Please enter your registered email address.');
      return;
    }

    if (!sanitizedEmail.includes('@') || !sanitizedEmail.includes('.')) {
      setFieldError('Please enter a valid email format (e.g., student@nirmauni.ac.in).');
      return;
    }

    setIsLoading(true);

    try {
      // Endpoint: POST /api/auth/password-reset/request/
      const res = await authService.requestPasswordReset(sanitizedEmail);
      toast.success(res.message || 'Password reset OTP sent to your email.');

      // Navigate to /verify-otp in PASSWORD_RESET mode
      navigate('/verify-otp', {
        state: {
          email: sanitizedEmail,
          mode: 'PASSWORD_RESET',
        },
      });
    } catch (err) {
      const errorMsg = authService.parseApiError(err);
      setApiError(errorMsg);
      if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('found') || errorMsg.toLowerCase().includes('exist')) {
        setFieldError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      flipped={false}
      badgeText="Account Recovery"
      headline="Fast & Secure Password Recovery"
      description="Never lose access to your placement updates or alumni network. Recover your account in seconds using cryptographically signed recovery tokens."
      bullets={[
        "Instant 6-digit recovery OTP via university SMTP",
        "Single-use token prevents credential hijacking",
        "Encrypted password update without exposing prior secrets"
      ]}
      gradientFrom="from-[#3E1F09]"
      gradientVia="via-[#602E0A]"
      gradientTo="to-[#0F172A]"
      accentColor="text-amber-400"
    >
      <div className="space-y-6">
        <div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Forgot password?
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Enter your registered email address to receive a recovery code
          </p>
        </div>

        {/* API Error Alert Banner */}
        {apiError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Recovery request failed</p>
              <p className="text-red-600 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Registered Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  if (apiError) setApiError('');
                  if (fieldError) setFieldError('');
                  setEmail(e.target.value);
                }}
                disabled={isLoading}
                placeholder="name@nirmauni.ac.in or alumni@gmail.com"
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                  fieldError
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-300 focus:ring-amber-500/30 focus:border-amber-500'
                }`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            {fieldError ? (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldError}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                We'll send a 6-digit recovery OTP valid for 10 minutes.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-2 font-bold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
              isLoading
                ? 'bg-amber-300 text-slate-700 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-900 transform active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
                <span>Sending Recovery Code...</span>
              </>
            ) : (
              <>
                <span>Send Recovery Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
