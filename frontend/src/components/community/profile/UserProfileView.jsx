import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Award,
  Globe,
  ExternalLink,
  Calendar,
  Sparkles,
  Share2,
  CheckCircle,
  Clock,
  Layers,
  Code2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  UserCheck,
  UserCog,
} from 'lucide-react';
import { fetchUserProfile } from '../../../services/community/communityService';
import { useAuth } from '../../../context/AuthContext';
import RoleBadgePill from '../common/RoleBadgePill';
import VerifiedOfficialBadge from '../common/VerifiedOfficialBadge';
import CommunityFeedStream from '../feed/CommunityFeedStream';

/**
 * UserProfileView Component
 * High-performance, LinkedIn-style profile viewport rendered dynamically on the same page.
 * Displays all relational information stored in the database:
 * - Cover banner & high-resolution avatar
 * - Identity & Headline (Name, Role, Department, Batch, Current Company/Job Title)
 * - "About" summary section
 * - "Experience & Campus Placements" section
 * - "Skills & Proficiencies" with proficiency chips
 * - "Social & Professional Profiles" (LinkedIn, GitHub, Portfolio, LeetCode)
 * - "Interview Experiences" breakdowns authored by user
 * - "Activity & Published Posts" stream (calls authorId={userId} polymorphically)
 */
export default function UserProfileView({ userId, onBack }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'posts'

  useEffect(() => {
    let isMounted = true;
    if (!userId) return;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchUserProfile(userId);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load user profile:', err);
          setError(err?.response?.data?.error || err.message || 'Failed to load user profile.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="h-36 sm:h-44 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
          <div className="px-6 pb-6 pt-0 relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-300 border-4 border-white -mt-12 sm:-mt-14" />
            <div className="mt-4 space-y-2">
              <div className="h-6 w-48 bg-slate-200 rounded-md" />
              <div className="h-4 w-72 bg-slate-100 rounded-md" />
            </div>
          </div>
        </div>
        <div className="h-40 bg-white rounded-xl border border-slate-200/90" />
        <div className="h-40 bg-white rounded-xl border border-slate-200/90" />
      </div>
    );
  }

  // Error State
  if (error || !profile) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-4 shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">Profile Not Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {error || 'The requested user profile could not be loaded.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </button>
      </div>
    );
  }

  const {
    id,
    full_name,
    email,
    role,
    profile_photo,
    is_verified,
    headline,
    identity = {},
    skills = [],
    social_links = [],
    experience = [],
    interview_experiences = [],
    ai_usage = [],
    stats = {},
  } = profile;

  const initial = full_name ? full_name.charAt(0).toUpperCase() : 'U';

  const isOwnProfile = currentUser && (
    String(currentUser.id) === String(id) ||
    String(userId).toLowerCase() === 'me' ||
    (currentUser.email && email && currentUser.email.toLowerCase() === email.toLowerCase())
  );

  const formatProficiencyColor = (proficiency) => {
    switch (proficiency?.toUpperCase()) {
      case 'ADVANCED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERMEDIATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BEGINNER':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP HERO: LinkedIn-Style Banner & Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs relative">
        {/* Cover Banner */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30 pointer-events-none" />

          {/* Top Left: Back to Feed CTA Button */}
          <button
            type="button"
            onClick={onBack}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-white/95 hover:bg-white shadow-xs backdrop-blur-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Feed</span>
          </button>

          {/* Top Right: Update Profile CTA Button if Viewing Own Profile */}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-white/95 hover:bg-white shadow-xs backdrop-blur-xs transition-all cursor-pointer"
              title="Edit Profile in Account Settings"
            >
              <UserCog className="w-3.5 h-3.5 text-blue-600" />
              <span>Update Profile</span>
            </button>
          )}
        </div>

        {/* Profile Card Body */}
        <div className="px-5 sm:px-7 pb-6 pt-0 relative">
          {/* Overlapping Avatar Container */}
          <div className="flex justify-between items-end flex-wrap gap-3 -mt-12 sm:-mt-16 mb-3">
            <div className="relative">
              {profile_photo ? (
                <img
                  src={profile_photo}
                  alt={full_name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md object-cover bg-white"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-3xl sm:text-4xl shadow-2xs">
                  {initial}
                </div>
              )}
              {is_verified && (
                <div
                  className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white shadow-2xs"
                  title="Verified Community Member"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Quick Action Pills: Update Profile & Jump to Posts */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
                  title="Update your account and profile settings"
                >
                  <UserCog className="w-3.5 h-3.5 text-blue-600" />
                  <span>Update Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const postsElem = document.getElementById('user-profile-posts');
                  if (postsElem) {
                    postsElem.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Posts ({stats.total_posts || 0})</span>
              </button>
            </div>
          </div>

          {/* Name & Headline Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {full_name}
              </h1>
              {is_verified && <VerifiedOfficialBadge />}
              <RoleBadgePill role={role} />
            </div>

            {headline && (
              <p className="text-sm font-medium text-slate-700 leading-snug">
                {headline}
              </p>
            )}

            {/* Quick Location & Educational Meta Chips */}
            <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap text-xs text-slate-500 pt-1">
              {identity.department && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {identity.department}
                    {identity.batch ? ` • ${identity.batch}` : ''}
                  </span>
                </div>
              )}

              {identity.current_company && (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{identity.current_company}</span>
                </div>
              )}

              {identity.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{identity.location}</span>
                </div>
              )}

              {email && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links Row in Hero */}
          {social_links && social_links.length > 0 && (
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600 mr-1">Connect:</span>
              {social_links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors"
                >
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span className="capitalize">{link.platform.toLowerCase()}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. ABOUT SECTION */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">About</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {identity.bio?.trim() ||
            `Passionate ${role.toLowerCase()} in the university community actively contributing to technical discussions, placement insights, and peer growth.`}
        </p>

        {/* Highlighted Meta Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="block text-[11px] text-slate-500 font-medium">Community Role</span>
            <span className="block text-xs font-bold text-slate-900 capitalize mt-0.5">{role.replace(/_/g, ' ').toLowerCase()}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="block text-[11px] text-slate-500 font-medium">Department</span>
            <span className="block text-xs font-bold text-slate-900 truncate mt-0.5">
              {identity.department || 'Institute of Tech'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="block text-[11px] text-slate-500 font-medium">
              {role === 'ALUMNI' ? 'Years of Experience' : 'Semester'}
            </span>
            <span className="block text-xs font-bold text-slate-900 mt-0.5">
              {role === 'ALUMNI'
                ? `${identity.years_of_experience || 0} Years`
                : identity.semester
                ? `Semester ${identity.semester}`
                : 'Current Student'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="block text-[11px] text-slate-500 font-medium">Posts Contributed</span>
            <span className="block text-xs font-bold text-blue-600 mt-0.5">
              {stats.total_posts || 0} Updates
            </span>
          </div>
        </div>
      </div>

      {/* 3. EXPERIENCE & CAMPUS PLACEMENTS (If Alumni or Student with Placement Records) */}
      {(role === 'ALUMNI' || (experience && experience.length > 0)) && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {role === 'ALUMNI' ? 'Work Experience' : 'Placement & Internship Records'}
            </h2>
          </div>

          {/* Alumni Current Job Experience */}
          {role === 'ALUMNI' && identity.current_company && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">
                    {identity.current_job_title || 'Software Professional'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Current Position
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700">{identity.current_company}</p>
                <p className="text-xs text-slate-500">
                  {identity.years_of_experience ? `${identity.years_of_experience} years professional experience` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Student Placement History List */}
          {experience && experience.length > 0 && (
            <div className="space-y-2.5">
              {experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900">{exp.company}</h4>
                      {exp.package_lpa && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {exp.package_lpa} LPA
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {exp.job_category ? exp.job_category.replace(/_/g, ' ') : 'Placement Offer'} • {exp.offer_type?.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Placement Year: {exp.placement_year} • Hiring Mode: {exp.hiring_mode?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SKILLS & PROFICIENCIES SECTION */}
      {skills && skills.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">Skills & Endorsements</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {skills.map((skillItem, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 shadow-2xs"
              >
                <span className="font-semibold text-slate-800">{skillItem.name}</span>
                {skillItem.proficiency && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${formatProficiencyColor(
                      skillItem.proficiency
                    )}`}
                  >
                    {skillItem.proficiency}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. INTERVIEW EXPERIENCES AUTHORED (If Alumni) */}
      {interview_experiences && interview_experiences.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Interview Experiences Authored ({interview_experiences.length})
            </h2>
          </div>

          <div className="space-y-2">
            {interview_experiences.map((exp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/70 flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900">
                    {exp.company_name} - {exp.role_name || 'Interview Process'}
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Difficulty: <span className="font-semibold">{exp.difficulty}</span> • Result:{' '}
                    <span className="font-semibold text-emerald-700">{exp.result}</span>
                  </p>
                </div>
                {exp.rounds && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-amber-200 text-amber-800 shadow-2xs">
                    {exp.rounds.length} Rounds Breakdown
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. PUBLISHED POSTS & ACTIVITY STREAM SECTION */}
      <div id="user-profile-posts" className="space-y-4 pt-2">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Posts & Updates by {full_name}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            {stats.total_posts || 0} Published
          </span>
        </div>

        {/* Polymorphic Stream of User's Posts */}
        <CommunityFeedStream
          authorId={id}
          emptyTitle="No Posts Published Yet"
          emptyMessage={`${full_name} has not published any community updates or hiring drives yet.`}
        />
      </div>
    </div>
  );
}
