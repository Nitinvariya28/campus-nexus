import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, Sparkles } from 'lucide-react';

export default function AuthSplitLayout({
  flipped = false, // false: Visual Left, Form Right. true: Form Left, Visual Right (for Register)
  badgeText = "AlumiBridge · Campus Nexus",
  headline,
  description,
  bullets = [],
  gradientFrom = "from-slate-900",
  gradientVia = "via-blue-950",
  gradientTo = "to-indigo-950",
  accentColor = "text-amber-400",
  children
}) {
  const visualPanel = (
    <div className={`relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} text-white rounded-3xl overflow-hidden shadow-xl min-h-[640px]`}>
      {/* Decorative ambient blurred glow */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Brand Pill */}
      <div className="relative z-10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
            Nirma University
          </span>
          <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>AlumiBridge</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </span>
        </div>
      </div>

      {/* Middle: Headline, Description & Features */}
      <div className="relative z-10 space-y-6 my-auto py-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{badgeText}</span>
        </div>

        <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
          {headline}
        </h2>

        <p className="text-sm xl:text-base text-blue-100/80 leading-relaxed max-w-md">
          {description}
        </p>

        {bullets.length > 0 && (
          <ul className="space-y-3 pt-2">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start space-x-3 text-xs xl:text-sm text-slate-200">
                <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${accentColor}`} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom: University Trust Footer */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/70">
        <span>Campus Placement & Alumni Gateway</span>
        <span>Est. 2026</span>
      </div>
    </div>
  );

  const formPanel = (
    <div className="flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-8 w-full max-w-xl mx-auto">
      {children}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6 lg:p-8">
        {flipped ? (
          <>
            {/* Form on Left, Visual on Right */}
            <div className="lg:col-span-6">{formPanel}</div>
            <div className="lg:col-span-6">{visualPanel}</div>
          </>
        ) : (
          <>
            {/* Visual on Left, Form on Right */}
            <div className="lg:col-span-6">{visualPanel}</div>
            <div className="lg:col-span-6">{formPanel}</div>
          </>
        )}
      </div>
    </div>
  );
}
