import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { KeyRound, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleMockSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your registered email address.');
      return;
    }
    toast.success('Password reset code sent! Redirecting to confirmation screen.');
    // Mock progression to reset password
    navigate('/reset-password');
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

        <form onSubmit={handleMockSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Registered Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nirmauni.ac.in or alumni@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-500">
              We'll send a 6-digit recovery OTP valid for 10 minutes.
            </p>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 transform active:scale-98"
          >
            <span>Send Recovery Code</span>
            <ArrowRight className="w-4 h-4" />
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
