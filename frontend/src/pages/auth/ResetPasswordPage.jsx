import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMockSubmit = (e) => {
    e.preventDefault();
    if (formData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (formData.new_password !== formData.confirm_password) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }
    toast.success('Password updated successfully! You can now log in.');
    // Mock progression back to login
    navigate('/login');
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

        <form onSubmit={handleMockSubmit} className="space-y-4">
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
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all placeholder:text-slate-400 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
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
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 transition-all placeholder:text-slate-400 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 transform active:scale-98"
          >
            <span>Update Password & Login</span>
            <ArrowRight className="w-4 h-4" />
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
