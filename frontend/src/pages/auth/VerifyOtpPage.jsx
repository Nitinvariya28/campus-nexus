import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { ShieldCheck, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  // 6-digit OTP code state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    // Only accept numeric digit
    if (value && !/^\d+$/.test(value)) return;

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

  const handleMockSubmit = (e) => {
    e.preventDefault();
    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      toast.error('Please enter the full 6-digit verification code.');
      return;
    }
    toast.success('OTP code verified! Account activated successfully.');
    // Mock progression to login
    navigate('/login');
  };

  const handleResend = () => {
    toast.success('A new 6-digit verification code has been dispatched.');
  };

  return (
    <AuthSplitLayout
      flipped={false}
      badgeText="Security Gate"
      headline="Protecting Campus Community Integrity"
      description="We enforce verification on every registration to guarantee authentic student profiles and trusted alumni connections."
      bullets={[
        "Instant 6-digit verification code via university SMTP",
        "Single-use verification token burned upon success",
        "Guaranteed 100% verified campus member ecosystem"
      ]}
      gradientFrom="from-[#022C22]"
      gradientVia="via-[#064E3B]"
      gradientTo="to-[#0F172A]"
      accentColor="text-emerald-400"
    >
      <div className="space-y-6">
        <div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Enter the 6-digit verification code sent to your registered email
          </p>
        </div>

        {/* Mock recipient preview banner */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Verification target:</span>
          <span className="font-mono font-semibold text-slate-800">user@nirmauni.ac.in</span>
        </div>

        <form onSubmit={handleMockSubmit} className="space-y-6">
          {/* 6 SPLIT NUMERIC CODE BOXES */}
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
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-black text-slate-900 bg-white border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  required
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center pt-1">
              Code expires in 10 minutes.
            </p>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 transform active:scale-98"
          >
            <span>Verify & Activate Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Resend Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center space-x-1.5 font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Resend Code</span>
          </button>

          <Link
            to="/register"
            className="font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Change Email
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
