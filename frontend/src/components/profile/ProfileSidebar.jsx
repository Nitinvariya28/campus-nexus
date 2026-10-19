import React from 'react';
import { Camera, GraduationCap, Calendar, Phone, MapPin, Building, Briefcase, Sparkles, MessageSquare } from 'lucide-react';

/**
 * ProfileSidebar Component
 * Sticky left column displaying user photo, verified role badge, metadata list, and quick stats.
 */
export default function ProfileSidebar({ profile, user, userRole }) {
  // Role badge style configuration
  const getRoleBadge = (role) => {
    switch (role) {
      case 'STUDENT':
        return {
          label: 'STUDENT',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'ALUMNI':
        return {
          label: 'VERIFIED ALUMNI',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'PLACEMENT_CELL':
        return {
          label: 'PLACEMENT CELL',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      default:
        return {
          label: role || 'MEMBER',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const roleBadge = getRoleBadge(userRole || user?.role || 'STUDENT');

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      {/* Avatar & Primary Identity */}
      <div className="flex flex-col items-center text-center">
        <div className="relative group mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 font-bold text-2xl shadow-inner">
            {profile?.avatar_url || user?.profile_photo ? (
              <img
                src={profile?.avatar_url || user?.profile_photo}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(user?.email || 'U')[0].toUpperCase()}</span>
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition"
            title="Upload photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <span className={`px-2.5 py-0.5 text-2xs font-semibold rounded-full border mb-2 ${roleBadge.className}`}>
          {roleBadge.label}
        </span>

        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          {profile?.full_name || user?.first_name || 'AlumiBridge User'}
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-0.5 break-all">
          {user?.email || 'user@nirmauni.ac.in'}
        </p>
      </div>

      <hr className="border-slate-100" />

      {/* Metadata Attributes List */}
      <div className="space-y-3 text-xs text-slate-600">
        {userRole === 'STUDENT' && (
          <>
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">
                {profile?.department || 'Computer Science & Engineering'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{profile?.batch || 'Batch 2024 - 2028'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 text-center font-bold text-slate-400 shrink-0">S</span>
              <span>Semester {profile?.semester || 4}</span>
            </div>
          </>
        )}

        {userRole === 'ALUMNI' && (
          <>
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">
                {profile?.current_company?.name || 'Microsoft'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{profile?.role || 'Senior Cloud Solutions Architect'}</span>
            </div>
          </>
        )}

        {userRole === 'PLACEMENT_CELL' && (
          <div className="flex items-center gap-2.5">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">Training & Placement Cell</span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{profile?.phone || '+91 9123456789'}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{profile?.location || profile?.address || 'Ahmedabad, Gujarat'}</span>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Quick Stats Widget */}
      <div className="space-y-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
          Activity Summary
        </h3>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <span className="text-base font-bold text-slate-900 block">
              {profile?.stats?.total_posts || 8}
            </span>
            <span className="text-2xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
              <MessageSquare className="w-3 h-3 text-slate-400" /> Posts
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <span className="text-base font-bold text-slate-900 block">
              {profile?.skills?.length || 5}
            </span>
            <span className="text-2xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-slate-400" /> Skills
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
