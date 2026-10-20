import React from 'react';
import { GraduationCap, Calendar, Lock } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';

/**
 * AcademicSection Component
 * University Academic Background:
 * - For Students: Department and Batch Cohort are permanently FIXED (derived from official enrollment ID / email).
 *   Current Semester (1-8) is updatable via interactive segmented controls.
 * - For Alumni: Department and Graduation Batch are selectable via custom interactive dropdowns.
 */
export default function AcademicSection({
  formData,
  onChange,
  options,
  isAlumni = false,
  title = 'Academic Information',
}) {
  const departments = options?.academic_form?.departments || options?.departments || [];
  const batches = options?.academic_form?.batches || options?.batches || [];

  // Determine current display names
  const departmentName =
    formData?.department ||
    departments.find((d) => String(d.id) === String(formData?.department_id))?.name ||
    'Department not assigned';

  const batchName =
    formData?.batch ||
    batches.find((b) => String(b.id) === String(formData?.batch_id))?.name ||
    'Batch not assigned';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {!isAlumni && (
          <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" /> Official University Trajectory
          </span>
        )}
      </div>

      {!isAlumni ? (
        /* STUDENT VIEW: Department & Batch are permanently FIXED. Semester is interactive */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fixed Department Card */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Department
                </label>
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> Fixed
                </span>
              </div>
              <div className="flex items-center justify-between w-full bg-slate-50/80 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs">
                <div className="flex items-center gap-2.5 truncate">
                  <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{departmentName}</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
              </div>
            </div>

            {/* Fixed Batch Cohort Card */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Batch Cohort
                </label>
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> Fixed
                </span>
              </div>
              <div className="flex items-center justify-between w-full bg-slate-50/80 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-2xs">
                <div className="flex items-center gap-2.5 truncate">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{batchName}</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
              </div>
            </div>
          </div>

          {/* Updatable Current Semester (Interactive Segmented 8-Pill Control) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Current Semester (1-8)
              </label>
              <span className="text-2xs text-blue-600 font-medium">
                Click to update active term
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const isSelected = Number(formData?.semester) === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => onChange?.({ target: { name: 'semester', value: sem } })}
                    className={`py-2.5 px-2 text-center rounded-xl font-semibold text-xs border transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200/90 text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 shadow-2xs'
                    }`}
                  >
                    Sem {sem}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ALUMNI VIEW: Department & Batch are selectable via CustomSelect */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Alma Mater Department
            </label>
            <CustomSelect
              name="department_id"
              value={formData?.department_id || ''}
              onChange={onChange}
              options={departments}
              placeholder="Select Department..."
              icon={GraduationCap}
              searchable={true}
            />
          </div>

          {/* Batch Cohort Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Graduation Batch Cohort
            </label>
            <CustomSelect
              name="batch_id"
              value={formData?.batch_id || ''}
              onChange={onChange}
              options={batches}
              placeholder="Select Batch Cohort..."
              icon={Calendar}
              searchable={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
