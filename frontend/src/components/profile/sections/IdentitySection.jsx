import React from 'react';
import { User, Lock, Edit3 } from 'lucide-react';

/**
 * IdentitySection Component
 * Base template for personal and institutional identity fields.
 */
export default function IdentitySection({ userRole, formData, onChange }) {
  const isStudent = userRole === 'STUDENT';
  const isAlumni = userRole === 'ALUMNI';
  const isPlacementCell = userRole === 'PLACEMENT_CELL';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Identity Information</h2>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Name {isStudent && <span className="text-slate-400 font-normal lowercase">(read-only)</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              name="full_name"
              disabled={isStudent}
              defaultValue={formData?.full_name || 'Aarav Patel'}
              onChange={onChange}
              className={`w-full rounded-lg px-3.5 py-2 text-sm border ${
                isStudent
                  ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-white border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
            {isStudent && (
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              name="email"
              disabled
              defaultValue={formData?.email || '24bce001@nirmauni.ac.in'}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>
          {isAlumni && (
            <p className="text-2xs text-blue-600 mt-1 cursor-pointer hover:underline">
              Change personal email in Security tab
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Professional Bio
          </label>
          <textarea
            name="bio"
            rows="3"
            defaultValue={formData?.bio || 'Competitive programmer and aspiring cloud architect.'}
            onChange={onChange}
            placeholder="Write a brief professional summary..."
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Phone Number
          </label>
          <input
            type="text"
            name="phone"
            maxLength={15}
            defaultValue={formData?.phone || '+91 9123456789'}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Location / Residential Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Location / Address
          </label>
          <input
            type="text"
            name="location"
            defaultValue={formData?.location || formData?.address || 'Ahmedabad, Gujarat'}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
    </div>
  );
}
