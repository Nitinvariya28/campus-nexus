import React from 'react';
import { Briefcase, Building, Edit3 } from 'lucide-react';

/**
 * CareerSection Component
 * Alumni-specific corporate career tracking: Company, Role, Category, and Experience.
 */
export default function CareerSection({ formData, onChange, options }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-semibold text-slate-900">Current Career Information</h2>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company with Tier Badge */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Current Company
          </label>
          <div className="flex items-center gap-2">
            <select
              name="company_id"
              defaultValue={formData?.company_id || 1}
              onChange={onChange}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="1">Microsoft</option>
              <option value="2">Google</option>
              <option value="3">Amazon</option>
              <option value="4">Oracle</option>
            </select>
            <span className="px-2.5 py-1 text-2xs font-semibold rounded-md bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
              Super Dream
            </span>
          </div>
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
            defaultValue={formData?.role || 'Senior Cloud Solutions Architect'}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Job Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Job Category
          </label>
          <select
            name="job_category"
            defaultValue={formData?.job_category || 'DEVOPS_CLOUD'}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="SOFTWARE">Software & Engineering</option>
            <option value="DATA_SCIENCE">Data Science & AI</option>
            <option value="PRODUCT_MANAGEMENT">Product Management</option>
            <option value="DESIGN">Design & UI/UX</option>
            <option value="DEVOPS_CLOUD">DevOps & Cloud</option>
            <option value="SECURITY">Cyber Security</option>
            <option value="BUSINESS_SALES">Business & Sales</option>
            <option value="OTHER">Other</option>
          </select>
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
            defaultValue={formData?.years_of_experience || 4}
            onChange={onChange}
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
    </div>
  );
}
