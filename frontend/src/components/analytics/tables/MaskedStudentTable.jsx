import React from 'react';
import DataTable from './DataTable';
import { AlertTriangle, ExternalLink } from 'lucide-react';

/**
 * MaskedStudentTable Component
 * Used in Placement Cell dashboard for student intervention queues.
 * Strictly displays masked identifiers (e.g., STU-0045) to protect student privacy.
 */
export default function MaskedStudentTable({ students = [] }) {
  const columns = [
    {
      key: 'maskedId',
      label: 'Student Code',
      render: (val) => (
        <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
          {val}
        </span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (val) => <span className="text-slate-700">{val}</span>,
    },
    {
      key: 'atsScore',
      label: 'ATS Readiness',
      render: (score) => {
        const isLow = score < 60;
        return (
          <span
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
              isLow ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isLow && <AlertTriangle className="w-3 h-3" />}
            {score}%
          </span>
        );
      },
    },
    {
      key: 'criticalMissingSkill',
      label: 'Target Skill Gap',
      render: (skill) => (
        <span className="text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
          {skill}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Intervention',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => alert(`Trigger intervention for ${row.maskedId}`)}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
        >
          <span>Recommend Prep</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Student Readiness Intervention Queue
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort members with missing skills or low resume match requiring placement guidance
          </p>
        </div>
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          {students.length} Action Items
        </span>
      </div>

      <DataTable
        columns={columns}
        data={students}
        emptyMessage="No students currently require readiness intervention."
      />
    </div>
  );
}
