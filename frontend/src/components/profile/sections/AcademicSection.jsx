import React from 'react';
import { GraduationCap, Edit3 } from 'lucide-react';

/**
 * AcademicSection Component
 * Student-specific academic trajectory: Department, Batch, and Semester (1-8).
 */
export default function AcademicSection({ formData, onChange, options }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Academic Information</h2>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Department */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Department
          </label>
          <select
            name="department_id"
            defaultValue={formData?.department_id || 1}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="1">Computer Science & Engineering</option>
            <option value="2">Information Technology</option>
            <option value="3">Electronics & Communication</option>
            <option value="4">Mechanical Engineering</option>
          </select>
        </div>

        {/* Batch */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Batch Cohort
          </label>
          <select
            name="batch_id"
            defaultValue={formData?.batch_id || 1}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="1">2024 - 2028</option>
            <option value="2">2023 - 2027</option>
            <option value="3">2022 - 2026</option>
            <option value="4">2021 - 2025</option>
          </select>
        </div>

        {/* Current Semester (Restricted to 1-8 per CheckConstraint) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Current Semester (1-8)
          </label>
          <select
            name="semester"
            defaultValue={formData?.semester || 4}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
