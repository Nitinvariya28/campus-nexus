import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, RotateCcw } from 'lucide-react';

export default function ErrorCard({
  code,
  title,
  subtitle,
  icon: Icon,
  badgeBg = "bg-amber-50 text-amber-600 border-amber-200",
  iconBg = "bg-amber-100 text-amber-700",
  primaryBtnText = "Return to Home",
  primaryBtnLink = "/",
  secondaryBtnText = "Go Back",
  onSecondaryClick,
  action
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onSecondaryClick) {
      onSecondaryClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="py-12 sm:py-16 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm text-center space-y-6">
        
        {/* Error Code Pill */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border text-xs font-mono font-bold tracking-wider uppercase mb-1">
          <span className={`px-2 py-0.5 rounded-full ${badgeBg}`}>
            Error {code}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 font-sans">AlumiBridge System</span>
        </div>

        {/* Central Icon Illustration */}
        <div className="flex justify-center">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xs ${iconBg} transform transition-transform hover:scale-105 duration-200`}>
            {Icon && <Icon className="w-10 h-10" />}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Custom additional action element if passed */}
        {action}

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>{secondaryBtnText}</span>
          </button>

          <Link
            to={primaryBtnLink}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            <span>{primaryBtnText}</span>
          </Link>
        </div>

        {/* University Support Footnote */}
        <div className="pt-6 border-t border-slate-100 text-xs text-slate-400">
          Need assistance? Contact{' '}
          <a
            href="mailto:support@alumibridge.nirmauni.ac.in"
            className="text-blue-600 hover:underline font-medium"
          >
            support@alumibridge.nirmauni.ac.in
          </a>
        </div>
      </div>
    </div>
  );
}
