import React from 'react';
import { Building2, Briefcase, Megaphone, BookOpen, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * InstitutionalTelemetrySection Component
 * Placement Cell specific governance activity telemetry and dashboard shortcut.
 */
export default function InstitutionalTelemetrySection({ stats }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-slate-900">Campus Placement Telemetry</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {stats?.total_opportunities_posted || 45}
            </div>
            <div className="text-xs text-slate-500">Placement Drives</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {stats?.total_announcements_sent || 18}
            </div>
            <div className="text-xs text-slate-500">Announcements</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {stats?.total_resources_uploaded || 32}
            </div>
            <div className="text-xs text-slate-500">Shared Resources</div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
        <div className="text-xs text-blue-900">
          <span className="font-semibold block text-sm">Deep Campus Placement Analytics</span>
          View absorption hero matrices, CTC distributions, and recruitment trends.
        </div>
        <Link
          to="/analytics/placement"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition"
        >
          View Dashboard <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
