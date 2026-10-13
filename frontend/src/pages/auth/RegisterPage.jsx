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
  User, 
  Lock 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  // Role switcher: 'STUDENT' (default) vs 'ALUMNI'
  const [role, setRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);

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
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handleAlumniChange = (e) => {
    setAlumniForm({ ...alumniForm, [e.target.name]: e.target.value });
  };

  const handleMockSubmit = (e) => {
    e.preventDefault();
    if (role === 'STUDENT') {
      if (!studentForm.email.endsWith('@nirmauni.ac.in')) {
        toast.error('Student email must end with @nirmauni.ac.in');
        return;
      }
    } else {
      if (!alumniForm.personal_email || !alumniForm.date_of_birth) {
        toast.error('Please complete all alumni identity verification fields.');
        return;
      }
    }
    toast.success(`${role === 'STUDENT' ? 'Student' : 'Alumni'} registration form validated!`);
    // Mock progression to OTP verification screen
    navigate('/verify-otp');
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
            onClick={() => setRole('STUDENT')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              role === 'STUDENT'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Current Student</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('ALUMNI')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              role === 'ALUMNI'
                ? 'bg-white text-purple-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Graduate Alumni</span>
          </button>
        </div>

        {/* DYNAMIC FORM RENDERING BASED ON ROLE */}
        <form onSubmit={handleMockSubmit} className="space-y-4">
          
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    required
                  />
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    required
                  />
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Must be your official <span className="font-semibold text-slate-700">@nirmauni.ac.in</span> address.
                </p>
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 pr-10"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    required
                  />
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    required
                  />
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Your graduation roll email used to verify student records.
                </p>
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    required
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Required to verify matching graduation dataset.
                </p>
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  OTP code will be dispatched to this personal address.
                </p>
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className={`w-full mt-3 text-white font-semibold text-sm py-3 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
              role === 'STUDENT'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <span>Register as {role === 'STUDENT' ? 'Student' : 'Alumni'}</span>
            <ArrowRight className="w-4 h-4" />
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
