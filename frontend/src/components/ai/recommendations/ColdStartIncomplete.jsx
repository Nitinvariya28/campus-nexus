import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, UserCheck, ArrowRight, ShieldAlert } from 'lucide-react';

/**
 * ColdStartIncomplete Component
 * Displayed when user has an incomplete profile (missing skills, bio, or department).
 * Encourages user to fill their profile to unlock high-precision AI vector recommendations.
 */
export default function ColdStartIncomplete({ message }) {
  return (
    <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-6 sm:p-8 text-center shadow-xs space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
        <Sparkles className="w-7 h-7 text-amber-300" />
      </div>

      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-slate-900">
          Complete Your Profile to Unlock Recommendations
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {message || 'Add your technical skills and academic background to discover student peers and alumni mentors.'}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all transform hover:-translate-y-0.5"
        >
          <UserCheck className="w-4 h-4" />
          <span>Update Skills & Profile</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="pt-3 border-t border-blue-100/80 flex items-center justify-center gap-2 text-2xs sm:text-xs text-slate-500">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
        <span>Profiles with 3+ technical skills receive 85% higher matching accuracy.</span>
      </div>
    </div>
  );
}
