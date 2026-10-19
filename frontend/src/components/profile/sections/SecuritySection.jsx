import React, { useState } from 'react';
import { KeyRound, Mail, AlertTriangle, Lock } from 'lucide-react';

/**
 * SecuritySection Component
 * Dedicated security management: Password change, role-adaptive email update, and Danger Zone.
 */
export default function SecuritySection({ userRole, userEmail, onChangePassword, onChangeEmail, onDeleteAccount }) {
  const isStudent = userRole === 'STUDENT';
  const isAlumni = userRole === 'ALUMNI';
  const isPlacementCell = userRole === 'PLACEMENT_CELL';

  return (
    <div className="space-y-6">
      {/* Top Grid: Password & Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Change Password */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Change Password</h2>
                <p className="text-2xs text-slate-500">Keep your account secure with a strong password.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="mt-1 flex items-center justify-between text-2xs text-slate-400">
                  <span>Strength</span>
                  <span className="text-amber-500 font-semibold">Medium</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onChangePassword}
            className="w-full mt-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700 transition"
          >
            Change Password
          </button>
        </div>

        {/* Card 2: Email Settings (Role-Adaptive) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">Email Settings</h2>
                <p className="text-2xs text-slate-500">
                  {isAlumni ? 'Update your personal email address.' : 'Official institutional email configuration.'}
                </p>
              </div>
            </div>

            {isAlumni ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Current Email
                  </label>
                  <input
                    type="email"
                    disabled
                    defaultValue={userEmail || 'priya.sharma@gmail.com'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="new.email@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Verify Account Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 text-sm font-semibold">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>{userEmail || '24bce001@nirmauni.ac.in'}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isStudent
                    ? 'Your university email is permanently locked to your student roll number by institutional university policy.'
                    : 'Institutional Placement Cell administrative accounts are centrally managed and locked.'}
                </p>
                <span className="inline-block px-2.5 py-1 rounded-md text-2xs font-semibold bg-slate-200/70 text-slate-700">
                  Institutional Managed
                </span>
              </div>
            )}
          </div>

          {isAlumni && (
            <button
              type="button"
              onClick={onChangeEmail}
              className="w-full mt-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700 transition"
            >
              Update Email
            </button>
          )}
        </div>
      </div>

      {/* Full-Width Danger Zone */}
      <div className="bg-red-50/60 border border-red-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900">Danger Zone: Delete Account</h3>
            <p className="text-xs text-red-700/90 mt-0.5 max-w-2xl leading-relaxed">
              This will permanently anonymize your account and delete private files. Your placement records and
              contributions will be retained anonymously for institutional analytics as &quot;Deleted User&quot;.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDeleteAccount}
          className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition shadow-xs whitespace-nowrap self-start sm:self-center"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
