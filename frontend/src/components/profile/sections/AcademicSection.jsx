import React, { useMemo } from 'react';
import { GraduationCap, Calendar, Lock, CheckCircle2, Clock } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';
import { calculateStudentSemester } from '../../../utils/academicUtils';

/**
 * AcademicSection Component
 * University Academic Background:
 * - For Students: Department and Batch Cohort are permanently FIXED.
 *   Semester is automatically and dynamically calculated from student admission year
 *   and current academic calendar without manual modification required.
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

  // Automatically calculate dynamic semester progression
  const semInfo = useMemo(() => {
    let admissionYear = null;
    if (formData?.batch) {
      const match = String(formData.batch).match(/(\d{4})/);
      if (match) admissionYear = Number(match[1]);
    }
    if (!admissionYear && formData?.email) {
      const match = String(formData.email).match(/^(\d{2})/);
      if (match) admissionYear = 2000 + Number(match[1]);
    }
    return calculateStudentSemester(admissionYear);
  }, [formData?.batch, formData?.email]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        </div>
        {!isAlumni && (
          <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Automatic Semester Progression
          </span>
        )}
      </div>

      {!isAlumni ? (
        /* STUDENT VIEW: Department & Batch are permanently FIXED. Semester is dynamically automated */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fixed Department Card */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Department
                </label>
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> Verified
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
                  <Lock className="w-3 h-3 text-slate-400" /> Verified
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

          {/* Automatic Dynamic Semester Status */}
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Academic Progression &amp; Semester
              </label>
              <span className="text-2xs text-slate-500 font-medium">
                Academic Year Schedule: Odd (Jul-Dec), Even (Jan-Jun)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/80 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {semInfo.is_graduated ? 'Grad' : `S${semInfo.semester}`}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{semInfo.semester_label} • {semInfo.academic_year_label}</span>
                    {semInfo.is_graduated && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                        Course Completed
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Admitted: {semInfo.admission_year} • Expected Completion: {semInfo.expected_graduation_year}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{new Date().getMonth() + 1 >= 7 ? 'Odd Semester Term' : 'Even Semester Term'}</span>
              </div>
            </div>

            {/* Visual 8-Semester Progression Track */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const isCurrent = semInfo.semester === sem && !semInfo.is_graduated;
                const isCompleted = sem < semInfo.semester || semInfo.is_graduated;

                return (
                  <div
                    key={sem}
                    className={`py-2 px-1 text-center rounded-xl text-xs border font-semibold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                        : isCompleted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200/80 text-slate-400'
                    }`}
                  >
                    <div>Sem {sem}</div>
                    <div className="text-[10px] font-normal opacity-85">
                      {isCurrent ? 'Current' : isCompleted ? 'Passed' : 'Upcoming'}
                    </div>
                  </div>
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
