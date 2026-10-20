import React from 'react';
import { Camera, Trash2, Loader2, GraduationCap, Calendar, Phone, MapPin, Building, Briefcase, Sparkles, MessageSquare, BriefcaseBusiness, Megaphone, BookOpen, FileText } from 'lucide-react';

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1600&auto=format&fit=crop';

const resolveImageUrl = (imgUrl) => {
  if (!imgUrl) return null;
  if (typeof imgUrl === 'string' && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'))) {
    return imgUrl;
  }
  const base = import.meta.env.VITE_BACKEND_MEDIA_URL || 'http://127.0.0.1:8000';
  return `${base}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
};

/**
 * ProfileSidebar Component
 * Sticky left column displaying user photo, verified role badge, real database metadata, and live stats.
 * Strictly zero dummy data - displays real user attributes or clean empty states.
 */
export default function ProfileSidebar({
  profile,
  user,
  userRole,
  stats,
  onUploadAvatar,
  onUploadCover,
  onDeleteCover,
  isUploadingCover,
}) {
  const fileInputRef = React.useRef(null);
  const coverFileInputRef = React.useRef(null);

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadAvatar) {
      onUploadAvatar(file);
    }
    // reset input so the same file could be selected again if needed
    e.target.value = '';
  };

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

  const displayName =
    profile?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) ||
    user?.email?.split('@')[0] ||
    'User';

  const avatarUrl = profile?.avatar_url || profile?.profile_photo || user?.profile_photo || null;
  const initial = displayName ? displayName[0].toUpperCase() : 'U';

  const rawCover = profile?.cover_image || user?.cover_image || null;
  const resolvedCover = resolveImageUrl(rawCover) || DEFAULT_COVER_IMAGE;
  const hasCustomCover = Boolean(rawCover);

  const postsCount = stats?.total_posts ?? profile?.stats?.total_posts ?? profile?.activity?.recent_posts_count ?? 0;
  const skillsCount = (profile?.skills && profile.skills.length) || stats?.total_skills || profile?.stats?.total_skills || profile?.analytics_data?.skills?.length || 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Mini Cover Banner */}
      <div className="h-28 sm:h-32 relative bg-slate-900 overflow-hidden group">
        <img
          src={resolvedCover}
          alt="Cover Banner"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            if (e.currentTarget.src !== DEFAULT_COVER_IMAGE) {
              e.currentTarget.src = DEFAULT_COVER_IMAGE;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-slate-950/30 pointer-events-none" />

        {onUploadCover && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
            <input
              type="file"
              ref={coverFileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onUploadCover) onUploadCover(file);
                e.target.value = '';
              }}
              accept="image/*"
              className="hidden"
            />
            {hasCustomCover && onDeleteCover && (
              <button
                type="button"
                onClick={onDeleteCover}
                disabled={isUploadingCover}
                title="Reset Cover to Default"
                className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-600/90 text-white backdrop-blur-md transition-colors cursor-pointer text-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              disabled={isUploadingCover}
              title="Change Profile Cover Banner"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer text-xs font-semibold disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-3xs hidden sm:inline">{hasCustomCover ? 'Cover' : 'Add Cover'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 pt-0 space-y-5 -mt-12 relative">
        {/* Avatar & Primary Identity */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-slate-500 font-bold text-2xl relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
                  {initial}
                </div>
              )}

              {/* Hover Camera Overlay for Avatar Upload */}
              {onUploadAvatar && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change Profile Photo"
                  className="absolute inset-0 bg-slate-900/50 backdrop-blur-2xs text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer focus:outline-none"
                >
                  <Camera className="w-5 h-5 drop-shadow" />
                  <span className="text-3xs font-medium mt-1">Upload</span>
                </button>
              )}
            </div>

            {onUploadAvatar && (
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileSelect}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
              />
            )}
          </div>

          <span className={`px-2.5 py-0.5 text-2xs font-semibold rounded-full border mb-2 ${roleBadge.className}`}>
            {roleBadge.label}
          </span>

          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {displayName}
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5 break-all">
            {user?.email || profile?.email || ''}
          </p>
        </div>

        <hr className="border-slate-100" />

      {/* Real Metadata Attributes List */}
      <div className="space-y-3 text-xs text-slate-600">
        {userRole === 'STUDENT' && (
          <>
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">
                {profile?.department || 'Department not set'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{profile?.batch ? `Batch ${profile.batch}` : 'Batch not assigned'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 text-center font-bold text-slate-400 shrink-0">S</span>
              <span>{profile?.semester ? `Semester ${profile.semester}` : 'Semester not set'}</span>
            </div>
          </>
        )}

        {userRole === 'ALUMNI' && (
          <>
            <div className="flex items-center gap-2.5">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">
                {profile?.current_career?.company?.name || profile?.company_name || 'Company not specified'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{profile?.current_career?.role || profile?.role || 'Role not specified'}</span>
            </div>
            {profile?.department && (
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{profile.department}</span>
              </div>
            )}
            {profile?.batch && (
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Batch {profile.batch}</span>
              </div>
            )}
          </>
        )}

        {userRole === 'PLACEMENT_CELL' && (
          <div className="flex items-center gap-2.5">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">Training & Placement Cell</span>
          </div>
        )}

        {profile?.phone && (
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{profile.phone}</span>
          </div>
        )}

        {(profile?.location || profile?.address) && (
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{profile?.location || profile?.address}</span>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* Real Quick Stats Widget */}
      <div className="space-y-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-slate-400">
          Activity Summary
        </h3>

        {userRole === 'PLACEMENT_CELL' ? (
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-sm font-bold text-slate-900 block">
                {stats?.total_opportunities_posted ?? 0}
              </span>
              <span className="text-3xs text-slate-500 mt-0.5 block">Drives</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-sm font-bold text-slate-900 block">
                {stats?.total_announcements_sent ?? 0}
              </span>
              <span className="text-3xs text-slate-500 mt-0.5 block">Alerts</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-sm font-bold text-slate-900 block">
                {stats?.total_resources_uploaded ?? 0}
              </span>
              <span className="text-3xs text-slate-500 mt-0.5 block">Files</span>
            </div>
          </div>
        ) : userRole === 'ALUMNI' ? (
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-base font-bold text-slate-900 block">
                {postsCount}
              </span>
              <span className="text-3xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <MessageSquare className="w-2.5 h-2.5 text-slate-400" /> Posts
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-base font-bold text-slate-900 block">
                {skillsCount}
              </span>
              <span className="text-3xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-slate-400" /> Skills
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-base font-bold text-slate-900 block">
                {stats?.total_interview_experiences ?? profile?.interview_experiences?.length ?? 0}
              </span>
              <span className="text-3xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <FileText className="w-2.5 h-2.5 text-slate-400" /> Guides
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-base font-bold text-slate-900 block">
                {postsCount}
              </span>
              <span className="text-3xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <MessageSquare className="w-2.5 h-2.5 text-slate-400" /> Posts
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-base font-bold text-slate-900 block">
                {skillsCount}
              </span>
              <span className="text-3xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-slate-400" /> Skills
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
              <span className="text-base font-bold text-slate-900 block">
                {stats?.total_resumes ?? profile?.resumes?.length ?? 0}
              </span>
              <span className="text-3xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                <FileText className="w-2.5 h-2.5 text-slate-400" /> Resumes
              </span>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
