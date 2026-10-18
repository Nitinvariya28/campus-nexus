import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Building2,
  DollarSign,
  Calendar,
  MapPin,
  GraduationCap,
  Sparkles,
  Link as LinkIcon,
  Send,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import CompanyCombobox from '../../common/CompanyCombobox';
import RoleCombobox from '../../common/RoleCombobox';

const OPPORTUNITY_TYPES = [
  { value: 'PLACEMENT', label: 'Placement Drive' },
  { value: 'INTERNSHIP', label: 'Internship Opportunity' },
];

const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PART_TIME', label: 'Part Time' },
];

const WORK_MODES = [
  { value: 'ON_SITE', label: 'On Site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

/**
 * OpportunityForm
 * Official campus hiring drive & internship creator for Placement Cell.
 * Uses CompanyCombobox, RoleCombobox, and exact backend choice mapping.
 */
export default function OpportunityForm({
  options,
  onSubmit,
  isSubmitting,
  submitError,
}) {
  const companies = useMemo(() => options?.companies || [], [options?.companies]);
  const departments = useMemo(() => options?.departments || [], [options?.departments]);
  const batches = useMemo(() => options?.batches || [], [options?.batches]);
  const skills = useMemo(() => options?.skills || [], [options?.skills]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [roleId, setRoleId] = useState(null);
  const [companyId, setCompanyId] = useState('');
  const [opportunityType, setOpportunityType] = useState('PLACEMENT');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [workMode, setWorkMode] = useState('ON_SITE');
  const [salaryPackage, setSalaryPackage] = useState('');
  const [location, setLocation] = useState('');
  const [minCgpa, setMinCgpa] = useState('');
  const [deadline, setDeadline] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const handleToggleDepartment = (deptId) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleToggleBatch = (batchId) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  const handleToggleSkill = (skillId) => {
    const existing = selectedSkills.find((s) => s.skill_id === skillId);
    if (existing) {
      setSelectedSkills(selectedSkills.filter((s) => s.skill_id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, { skill_id: skillId, importance: 'REQUIRED' }]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!title.trim()) errors.title = 'Job title is required.';
    if (!companyId) errors.companyId = 'Please select a company.';
    if (!description.trim()) errors.description = 'Job description is required.';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    // Format deadline safely for Django DateTimeField
    let formattedDeadline = null;
    if (deadline) {
      try {
        formattedDeadline = new Date(deadline).toISOString();
      } catch {
        formattedDeadline = deadline;
      }
    }

    const payload = {
      entity_type: 'OPPORTUNITY',
      title: title.trim(),
      role_id: roleId,
      role_title: title.trim(),
      company_id: parseInt(companyId),
      opportunity_type: opportunityType,
      employment_type: employmentType,
      work_mode: workMode,
      salary_package: salaryPackage.trim() || 'Competitive / As per industry norms',
      location: location.trim() || 'Ahmedabad, Gujarat (Campus)',
      min_cgpa: minCgpa ? parseFloat(minCgpa) : null,
      deadline: formattedDeadline,
      application_url: applicationUrl.trim() || 'https://nirmauni.ac.in/placements',
      description: description.trim(),
      status: 'OPEN',
      eligible_departments: selectedDepartments,
      eligible_batches: selectedBatches,
      skills: selectedSkills,
    };

    onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
      className="space-y-5"
    >
      {submitError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{typeof submitError === 'string' ? submitError : 'Failed to publish opportunity. Please check required fields.'}</span>
        </div>
      )}

      {/* 1. Opportunity / Drive Type Pills */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Drive Type <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {OPPORTUNITY_TYPES.map((t) => {
            const isSelected = opportunityType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setOpportunityType(t.value)}
                className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <span>{t.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Title & Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Job Role / Title <span className="text-red-500">*</span>
          </label>
          <RoleCombobox
            companyId={companyId}
            companyRoles={options?.company_roles || []}
            commonRoles={options?.common_roles || []}
            selectedRoleId={roleId}
            roleTitle={title}
            onChange={({ roleId: rId, roleTitle: rTitle }) => {
              setRoleId(rId);
              setTitle(rTitle);
            }}
            hasError={!!validationErrors.title}
            placeholder="Select target job role or type custom position..."
          />
          {validationErrors.title && (
            <p className="text-2xs text-red-600 font-medium">{validationErrors.title}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Hiring Company <span className="text-red-500">*</span>
          </label>
          <CompanyCombobox
            companies={companies}
            selectedCompanyId={companyId}
            onChange={({ companyId: cId }) => setCompanyId(cId || '')}
            placeholder="Search verified hiring company..."
          />
          {validationErrors.companyId && (
            <p className="text-2xs text-red-600 font-medium">{validationErrors.companyId}</p>
          )}
        </div>
      </div>

      {/* 3. Employment Type & Work Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Employment Model
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {EMPLOYMENT_TYPES.map((et) => {
              const isSelected = employmentType === et.value;
              return (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => setEmploymentType(et.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {et.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Work Mode
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {WORK_MODES.map((wm) => {
              const isSelected = workMode === wm.value;
              return (
                <button
                  key={wm.value}
                  type="button"
                  onClick={() => setWorkMode(wm.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {wm.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Compensation, Location & Min CGPA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Salary Package (CTC / Stipend)</span>
          </label>
          <input
            type="text"
            value={salaryPackage}
            onChange={(e) => setSalaryPackage(e.target.value)}
            placeholder="e.g. 14.50 LPA or ₹45,000 / mo"
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Job Location (Optional)</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Ahmedabad, Bangalore, or Remote"
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Min CGPA Cutoff (Optional)</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={minCgpa}
            onChange={(e) => setMinCgpa(e.target.value)}
            placeholder="e.g. 7.0 (Optional)"
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 5. Deadline & Application URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Application Deadline (Optional)</span>
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Apply Portal URL (Optional)</span>
          </label>
          <input
            type="url"
            value={applicationUrl}
            onChange={(e) => setApplicationUrl(e.target.value)}
            placeholder="https://nirmauni.ac.in/apply or Google Form"
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 6. Eligible Academic Departments */}
      {departments.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Eligible Academic Departments
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {departments.map((dept) => {
              const isSelected = selectedDepartments.includes(dept.id);
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleToggleDepartment(dept.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{dept.name}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Target Skills */}
      {skills.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Required Skills & Competencies</span>
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {skills.slice(0, 16).map((sk) => {
              const isSelected = selectedSkills.some((s) => s.skill_id === sk.id);
              return (
                <button
                  key={sk.id}
                  type="button"
                  onClick={() => handleToggleSkill(sk.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 text-amber-800 border-amber-400 font-semibold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{sk.name}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            Job Description & Criteria <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-slate-400 font-mono">{description.length} characters</span>
        </div>
        <textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Include job responsibilities, interview stages, selection timeline, and key requirements..."
          className={`w-full text-sm rounded-lg border p-3 bg-white text-slate-900 focus:outline-hidden focus:ring-2 shadow-2xs leading-relaxed ${
            validationErrors.description
              ? 'border-red-400 focus:ring-red-200'
              : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
          }`}
        />
        {validationErrors.description && (
          <p className="text-2xs text-red-600 font-medium">{validationErrors.description}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing Opportunity...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Publish Placement Drive</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
