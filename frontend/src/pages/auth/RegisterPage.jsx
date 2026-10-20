import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { 
  GraduationCap, 
  Briefcase, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Calendar, 
  Mail, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

export default function RegisterPage() {
  const navigate = useNavigate();
  // Role switcher: 'STUDENT' (default) vs 'ALUMNI'
  const [role, setRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Separate states for Student and Alumni to avoid field bleeding
  const [studentForm, setStudentForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });

  const [alumniForm, setAlumniForm] = useState({
    first_name: '',
    last_name: '',
    old_university_email: '',
    date_of_birth: '',
    personal_email: '',
    password: ''
  });

  const handleStudentChange = (e) => {
    if (apiError) setApiError('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handleAlumniChange = (e) => {
    if (apiError) setApiError('');
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
    setAlumniForm({ ...alumniForm, [e.target.name]: e.target.value });
  };

  const handleRoleSwitch = (newRole) => {
    if (isLoading) return;
    setRole(newRole);
    if (apiError) setApiError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setFieldErrors({});

    const errors = {};
    const nirmaPattern = /^\d{2}(bce|bec|bme|bam|bch|bee|bcv)\d{3}@nirmauni\.ac\.in$/i;

    // 1. Strict Client-Side In-Form Validations
    if (role === 'STUDENT') {
      if (!studentForm.first_name.trim()) errors.first_name = 'Please enter your first name.';
      if (!studentForm.last_name.trim()) errors.last_name = 'Please enter your last name.';
      
      if (!studentForm.email.trim()) {
        errors.email = 'Please enter your university email address.';
      } else if (!nirmaPattern.test(studentForm.email.trim())) {
        errors.email = 'Invalid format. Roll number must be exactly 3 digits (e.g., 24bce001@nirmauni.ac.in).';
      }

      if (!studentForm.password) {
        errors.password = 'Please enter a password.';
      } else if (studentForm.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long.';
      }
    } else {
      if (!alumniForm.first_name.trim()) errors.first_name = 'Please enter your first name.';
      if (!alumniForm.last_name.trim()) errors.last_name = 'Please enter your last name.';

      if (!alumniForm.old_university_email.trim()) {
        errors.old_university_email = 'Please enter your past university email.';
      } else if (!nirmaPattern.test(alumniForm.old_university_email.trim())) {
        errors.old_university_email = 'Invalid format. Must be a valid Nirma roll address (e.g., 20bce045@nirmauni.ac.in).';
      }

      if (!alumniForm.date_of_birth) {
        errors.date_of_birth = 'Please select your date of birth for identity verification.';
      }

      if (!alumniForm.personal_email.trim()) {
        errors.personal_email = 'Please enter your personal email address.';
      } else if (!alumniForm.personal_email.includes('@') || !alumniForm.personal_email.includes('.')) {
        errors.personal_email = 'Please enter a valid personal email address format.';
      }

      if (!alumniForm.password) {
        errors.password = 'Please enter a password.';
      } else if (alumniForm.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // 2. Dispatch Network Request to Backend
    setIsLoading(true);

    try {
      let responseMessage = '';
      let targetEmail = '';

      if (role === 'STUDENT') {
        const response = await authService.registerStudent(studentForm);
        responseMessage = response.message || 'OTP sent to your university email. Please verify.';
        targetEmail = studentForm.email.trim().toLowerCase();
      } else {
        const response = await authService.registerAlumni(alumniForm);
        responseMessage = response.message || 'OTP sent to your personal email. Please verify.';
        targetEmail = alumniForm.personal_email.trim().toLowerCase();
      }

      toast.success(responseMessage, { duration: 5000 });

      // Navigate to OTP verification screen passing recipient email and chosen role
      navigate('/verify-otp', {
        state: {
          email: targetEmail,
          role: role
        }
      });
    } catch (err) {
      const parsedError = authService.parseApiError(err);
      setApiError(parsedError);
      const lower = parsedError.toLowerCase();
      if (lower.includes('email') || lower.includes('nirma') || lower.includes('roll')) {
        setFieldErrors((prev) => ({
          ...prev,
          email: parsedError,
          old_university_email: parsedError,
          personal_email: parsedError
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      flipped={true} // FLIPPED: Form on Left, Visual Panel on Right
      badgeText="Join the Nexus"
      headline="Join 1500+ Nirma Innovators & Alumni"
      description="Connect directly with verified students and accomplished graduates across top tech, consulting, and engineering firms."
      bullets={[
        "Verified student & alumni credentials",
        "Direct peer-to-peer mentorship & career advice",
        "Exclusive campus drives & alumni job referrals"
      ]}
      gradientFrom="from-[#1E1B4B]"
      gradientVia="via-[#2E1065]"
      gradientTo="to-[#0F172A]"
      accentColor="text-amber-400"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose your university role to begin registration
          </p>
        </div>

        {/* ROLE SWITCHER TABS: [Student (Default)] vs [Alumni] */}
        <div className="p-1 bg-slate-100 rounded-xl flex items-center space-x-1 border border-slate-200">
          <button
            type="button"
            onClick={() => handleRoleSwitch('STUDENT')}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              role === 'STUDENT'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Current Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch('ALUMNI')}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              role === 'ALUMNI'
                ? 'bg-white text-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Graduate Alumni</span>
          </button>
        </div>

        {/* API Error Alert Banner */}
        {apiError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Registration failed</p>
              <p className="text-red-600 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {/* DYNAMIC FORM RENDERING BASED ON ROLE */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* =======================
              ROLE: STUDENT (4 Fields)
             ======================= */}
          {role === 'STUDENT' ? (
            <>
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={studentForm.first_name}
                    onChange={handleStudentChange}
                    placeholder="Rahul"
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      fieldErrors.first_name
                        ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-300 focus:ring-blue-600/30 focus:border-blue-600'
                    }`}
                  />
                  {fieldErrors.first_name && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.first_name}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={studentForm.last_name}
                    onChange={handleStudentChange}
                    placeholder="Patel"
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      fieldErrors.last_name
                        ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-300 focus:ring-blue-600/30 focus:border-blue-600'
                    }`}
                  />
                  {fieldErrors.last_name && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.last_name}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Student University Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  University Domain Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={studentForm.email}
                    onChange={handleStudentChange}
                    placeholder="24bce001@nirmauni.ac.in"
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      fieldErrors.email
                        ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-300 focus:ring-blue-600/30 focus:border-blue-600'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                {fieldErrors.email ? (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Must be your official <span className="font-semibold text-slate-700">@nirmauni.ac.in</span> address.
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={studentForm.password}
                    onChange={handleStudentChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 pr-10 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      fieldErrors.password
                        ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-300 focus:ring-blue-600/30 focus:border-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
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
            </>
          ) : (
            /* =======================
               ROLE: ALUMNI (6 Fields)
               ======================= */
            <>
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={alumniForm.first_name}
                    onChange={handleAlumniChange}
                    placeholder="Rahul"
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      fieldErrors.first_name
                        ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600'
                    }`}
                  />
                  {fieldErrors.first_name && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.first_name}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={alumniForm.last_name}
                    onChange={handleAlumniChange}
                    placeholder="Patel"
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      fieldErrors.last_name
                        ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600'
                    }`}
                  />
                  {fieldErrors.last_name && (
                    <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.last_name}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Past University Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Past University Email
                </label>
                <input
                  type="email"
                  name="old_university_email"
                  value={alumniForm.old_university_email}
                  onChange={handleAlumniChange}
                  placeholder="20bce045@nirmauni.ac.in"
                  disabled={isLoading}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    fieldErrors.old_university_email
                      ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                      : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600'
                  }`}
                />
                {fieldErrors.old_university_email ? (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.old_university_email}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Your graduation roll email used to verify student records.
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="date_of_birth"
                    value={alumniForm.date_of_birth}
                    onChange={handleAlumniChange}
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      fieldErrors.date_of_birth
                        ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600'
                    }`}
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
                {fieldErrors.date_of_birth ? (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.date_of_birth}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Required to verify matching graduation dataset.
                  </p>
                )}
              </div>

              {/* Personal Email (New Login ID) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Personal Email (Your Login ID)
                </label>
                <input
                  type="email"
                  name="personal_email"
                  value={alumniForm.personal_email}
                  onChange={handleAlumniChange}
                  placeholder="rahul.alumni@gmail.com"
                  disabled={isLoading}
                  className={`w-full px-3.5 py-2 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                    fieldErrors.personal_email
                      ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                      : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600'
                  }`}
                />
                {fieldErrors.personal_email ? (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.personal_email}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    OTP code will be dispatched to this personal address.
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={alumniForm.password}
                    onChange={handleAlumniChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={`w-full px-3.5 py-2 rounded-xl border bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 pr-10 disabled:bg-slate-50 disabled:cursor-not-allowed ${
                      fieldErrors.password
                        ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
                        : 'border-slate-300 focus:ring-purple-600/30 focus:border-purple-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
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
            </>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-3 text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
              isLoading
                ? (role === 'STUDENT' ? 'bg-blue-400' : 'bg-purple-400') + ' cursor-not-allowed'
                : (role === 'STUDENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700') + ' transform active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {role === 'STUDENT' ? 'Registering Student...' : 'Verifying Records & Registering...'}
                </span>
              </>
            ) : (
              <>
                <span>Register as {role === 'STUDENT' ? 'Student' : 'Alumni'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
