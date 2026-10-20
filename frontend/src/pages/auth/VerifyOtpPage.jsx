import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { 
  ShieldCheck, 
  ArrowRight, 
  RotateCw, 
  Lock, 
  Mail, 
  Loader2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mode detection: 'REGISTRATION' (default) vs 'PASSWORD_RESET'
  const mode = location.state?.mode || 'REGISTRATION';
  const email = location.state?.email || '';

  // 6-digit OTP code state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    // Only accept numeric digit
    if (value && !/^\d+$/.test(value)) return;
    if (apiError) setApiError('');

    const newOtp = [...otp];
    newOtp[index] = value ? value.slice(-1) : '';
    setOtp(newOtp);

    // Auto-advance focus to next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: move to previous box if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Smart Clipboard Paste: Pasting full 6-digit code auto-populates all 6 boxes
  const handlePaste = (e) => {
    e.preventDefault();
    if (apiError) setApiError('');
    const pastedData = e.clipboardData.getData('text').trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      toast.success('6-digit code pasted successfully!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setApiError('No target email address found. Please initiate the request again.');
      return;
    }

    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setApiError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      if (mode === 'PASSWORD_RESET') {
        // Mode B: Password Reset OTP Verification
        // Endpoint: POST /api/auth/password-reset/verify-otp/
        const data = await authService.verifyPasswordResetOtp({
          email,
          otp_code: fullCode,
        });

        toast.success('Code verified! Proceed to choose your new password.');

        // Navigate to Step 3 (/reset-password) carrying the cryptographically signed reset_token
        navigate('/reset-password', {
          state: {
            reset_token: data.reset_token,
            email,
          },
        });
      } else {
        // Mode A: Registration OTP Verification
        // Endpoint: POST /api/auth/verify-otp/
        const data = await authService.verifyRegistrationOtp({
          email,
          otp_code: fullCode,
        });

        toast.success(data.message || 'Account activated successfully! You can now log in.');

        // Navigate to login with verified email preloaded
        navigate('/login', {
          state: { email },
        });
      }
    } catch (err) {
      const parsedError = authService.parseApiError(err);
      setApiError(parsedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setApiError('No email address available to resend code.');
      return;
    }

    setIsResending(true);
    try {
      if (mode === 'PASSWORD_RESET') {
        // For password reset, we can re-invoke the password reset request endpoint
        const res = await authService.requestPasswordReset(email);
        toast.success(res.message || 'A new password recovery code has been dispatched.');
      } else {
        toast.success('Registration code is active for 10 minutes. Please check your inbox or spam folder.');
      }
    } catch (err) {
      const msg = authService.parseApiError(err);
      setApiError(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Configure theme & copy dynamically based on active mode
  const isReset = mode === 'PASSWORD_RESET';

  return (
    <AuthSplitLayout
      flipped={false}
      badgeText={isReset ? "Account Recovery" : "Security Gate"}
      headline={isReset ? "Secure Password Recovery Gate" : "Protecting Campus Community Integrity"}
      description={
        isReset
          ? "We verify single-use cryptographic recovery codes to protect student records and prevent credential takeover."
          : "We enforce verification on every registration to guarantee authentic student profiles and trusted alumni connections."
      }
      bullets={
        isReset
          ? [
              "Instant 6-digit recovery OTP via university SMTP",
              "Single-use token burned permanently upon verification",
              "Cryptographically signed reset token valid for 10 minutes"
            ]
          : [
              "Instant 6-digit verification code via university SMTP",
              "Single-use verification token burned upon success",
              "Guaranteed 100% verified campus member ecosystem"
            ]
      }
      gradientFrom={isReset ? "from-[#2E1065]" : "from-[#022C22]"}
      gradientVia={isReset ? "via-[#1E1B4B]" : "via-[#064E3B]"}
      gradientTo="to-[#0F172A]"
      accentColor={isReset ? "text-amber-400" : "text-emerald-400"}
    >
      <div className="space-y-6">
        <div>
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
              isReset ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isReset ? <KeyRound className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isReset ? 'Enter recovery code' : 'Verify your email'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {isReset
              ? 'Enter the 6-digit recovery code sent to your registered email'
              : 'Enter the 6-digit verification code sent to your university email'}
          </p>
        </div>

        {/* NON-CHANGEABLE READ-ONLY EMAIL BADGE */}
        {email ? (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5 text-slate-700 min-w-0">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500 hidden sm:inline">Target:</span>
              <span className="font-mono font-bold text-slate-900 truncate">{email}</span>
            </div>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-200/70 text-slate-600 text-[11px] font-semibold shrink-0">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Read-Only</span>
            </span>
          </div>
        ) : (
          /* Graceful Fallback if User directly opened /verify-otp */
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              No active verification session detected.
            </p>
            <p className="text-amber-700">
              Please register or request a password reset first to receive a 6-digit OTP code.
            </p>
            <div className="pt-1">
              <Link
                to={isReset ? '/forgot-password' : '/register'}
                className="font-bold underline text-amber-900 hover:text-amber-950 inline-flex items-center gap-1"
              >
                <span>{isReset ? '← Go to Forgot Password' : '← Go to Registration'}</span>
              </Link>
            </div>
          </div>
        )}

        {/* API Error Alert Banner */}
        {apiError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Verification failed</p>
              <p className="text-red-600 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6 SPLIT NUMERIC CODE BOXES WITH PASTE SUPPORT */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              6-Digit Verification Code
            </label>
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={isLoading || !email}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-black text-slate-900 bg-white border-2 rounded-xl focus:outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    isReset
                      ? 'border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                  required
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center pt-1">
              Code expires in 10 minutes.
            </p>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading || !email}
            className={`w-full text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
              isLoading || !email
                ? (isReset ? 'bg-purple-400' : 'bg-emerald-400') + ' cursor-not-allowed'
                : (isReset ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700') +
                  ' transform active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isReset ? 'Verifying Reset Code...' : 'Verifying & Activating...'}</span>
              </>
            ) : (
              <>
                <span>{isReset ? 'Verify Code & Set Password' : 'Verify & Activate Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend & Return Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !email}
            className={`inline-flex items-center space-x-1.5 font-semibold text-slate-600 transition-colors ${
              isReset ? 'hover:text-purple-700' : 'hover:text-emerald-700'
            } ${isResending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>{isResending ? 'Sending...' : 'Resend Code'}</span>
          </button>

          <Link
            to={isReset ? '/forgot-password' : '/register'}
            className="font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            {isReset ? 'Wrong Email? Return' : 'Change Email'}
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
