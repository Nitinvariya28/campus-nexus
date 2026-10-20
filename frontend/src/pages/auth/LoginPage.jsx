import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (apiError) setApiError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setFieldErrors({});

    const errors = {};
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      errors.email = 'Please enter a valid email format (e.g. student@nirmauni.ac.in).';
    }

    if (!formData.password) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Call DRF Login Endpoint POST /api/auth/login/
      const data = await authService.login({
        email: formData.email,
        password: formData.password
      });

      // 2. Update Global Auth State (Stores tokens and user info in localStorage)
      login(
        {
          access_token: data.access_token,
          refresh_token: data.refresh_token
        },
        data.user
      );

      toast.success(`Welcome back, ${data.user?.first_name || 'User'}!`);

      // 3. Navigate to intended target route (or default to Community Feed)
      const destination = location.state?.from?.pathname || location.state?.from || '/community';
      navigate(destination, { replace: true });
    } catch (err) {
      const parsedMessage = authService.parseApiError(err);
      setApiError(parsedMessage);

      // Handle specific backend case: Account exists but not verified (is_verified=False)
      if (
        parsedMessage.toLowerCase().includes('not verified') ||
        parsedMessage.toLowerCase().includes('otp verification')
      ) {
        setApiError('Account not verified. Redirecting to OTP verification...');
        setTimeout(() => {
          navigate('/verify-otp', {
            state: { email: formData.email.trim().toLowerCase() }
          });
        }, 1500);
      } else if (parsedMessage.toLowerCase().includes('credential') || parsedMessage.toLowerCase().includes('password')) {
        setFieldErrors({ password: 'Incorrect email or password.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      flipped={false}
      badgeText="Campus Connect"
      headline="Your campus community, all in one place."
      description="Chat with classmates, stay updated on announcements, and collaborate — all within your program portal."
      bullets={[
        "Real-time campus updates & networking",
        "Official placement announcements & job drives",
        "Secure university-verified access"
      ]}
      gradientFrom="from-[#0B1E36]"
      gradientVia="via-[#0F2B48]"
      gradientTo="to-[#143A60]"
      accentColor="text-blue-400"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Sign in to your Nirma campus portal
          </p>
        </div>

        {/* API Error Alert Banner */}
        {apiError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Sign in failed</p>
              <p className="text-red-600 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@nirmauni.ac.in or alumni@gmail.com"
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                  fieldErrors.email
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-300 focus:ring-blue-600/30 focus:border-blue-600'
                }`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 pr-10 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                  fieldErrors.password
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-slate-300 focus:ring-blue-600/30 focus:border-blue-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-2 text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 transform active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
