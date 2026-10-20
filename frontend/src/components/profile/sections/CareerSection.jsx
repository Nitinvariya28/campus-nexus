import React from 'react';
import { Briefcase } from 'lucide-react';
import CompanyCombobox from '../../community/common/CompanyCombobox';
import CustomSelect from '../common/CustomSelect';

/**
 * CareerSection Component
 * Alumni-specific corporate career tracking: Company, Role, Category, and Experience.
 * Uses searchable CompanyCombobox and dynamic job categories.
 */
export default function CareerSection({ formData, onChange, options }) {
  const companies = options?.current_career_form?.top_20_companies || [];
  const jobCategories = options?.current_career_form?.job_categories || [];

  const handleCompanyChange = ({ companyId, newCompanyName }) => {
    onChange?.({
      target: {
        name: 'company_id',
        value: companyId || '',
      },
    });
    if (newCompanyName) {
      onChange?.({
        target: {
          name: 'company_name',
          value: newCompanyName,
        },
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-semibold text-slate-900">Current Career Information</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company with Searchable Combobox */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Current Company
          </label>
          <CompanyCombobox
            companies={companies}
            selectedCompanyId={formData?.company_id || ''}
            newCompanyName={formData?.company_name && !formData?.company_id ? formData.company_name : ''}
            onChange={handleCompanyChange}
            placeholder="Search verified employer (e.g. Google, Microsoft)..."
          />
        </div>

        {/* Job Title / Role */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Job Title / Position
          </label>
          <input
            type="text"
            name="role"
            maxLength={150}
            value={formData?.role || ''}
            onChange={onChange}
            placeholder="e.g. Senior Software Engineer"
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Job Category with CustomSelect */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Job Category
          </label>
          <CustomSelect
            name="job_category"
            value={formData?.job_category || ''}
            onChange={onChange}
            options={jobCategories}
            placeholder="Select Domain Category..."
            icon={Briefcase}
          />
        </div>

        {/* Years of Experience */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Years of Experience
          </label>
          <input
            type="number"
            min="0"
            max="50"
            name="years_of_experience"
            value={formData?.years_of_experience ?? 0}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
    </div>
  );
}
