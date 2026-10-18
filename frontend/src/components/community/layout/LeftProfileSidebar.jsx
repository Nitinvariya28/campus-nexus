import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  FileText,
  Bookmark,
  Settings,
  Plus,
  ChevronRight,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import RoleBadgePill from '../common/RoleBadgePill';
import { COMMUNITY_SIDEBAR_NAV } from '../../../constants/community/communityConstants';

/**
 * LeftProfileSidebar Component
 * Left rail w-64 (256px fixed), sticky top-20.
 * Conforms to AlumiBridge Community Page.docx Section 3:
 * - Profile Snapshot
 * - [+ Create Post] CTA
 * - Your Posts (count: 12)
 * - Saved Posts (count: 34)
 * - Manage Your Posts
 * - Total Likes (count: 142)
 * - Total Comments (count: 38)
 * (Discover Members removed from sidebar per user instructions)
 */
export default function LeftProfileSidebar({ onCreatePost, onItemClick, className = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials = user
    ? `${user.first_name?.[0] || 'U'}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  const avatarUrl = user?.avatar
    ? `${import.meta.env.VITE_BACKEND_MEDIA_URL || 'http://127.0.0.1:8000'}${user.avatar}`
    : null;

  const iconMap = {
    FileText,
    Bookmark,
    Settings,
  };

  const handleCreatePostClick = () => {
    if (onItemClick) {
      onItemClick();
    }
    if (onCreatePost) {
      onCreatePost();
    } else {
      navigate('/community/create');
    }
  };

  return (
    <aside className={`w-full space-y-4 ${className}`}>
      {/* 1. Mini User Profile & Create Post CTA Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.first_name || 'User Avatar'}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs ring-2 ring-slate-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-900 text-amber-400 font-bold text-base flex items-center justify-center ring-2 ring-slate-100">
                {initials}
              </div>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-900">
            {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Campus Member' : 'Campus Member'}
          </h3>

          <p className="text-xs text-slate-500 mt-0.5">
            {user?.department || 'Nirma University'}
          </p>

          <div className="mt-2">
            <RoleBadgePill role={user?.role || 'STUDENT'} />
          </div>
        </div>

        {/* Primary "+ Create Post" CTA Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCreatePostClick}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* 2. Activity & Views Navigation Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-2xs">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
          Activity &amp; Views
        </div>

        <nav className="space-y-1 mt-1">
          {COMMUNITY_SIDEBAR_NAV.map((item) => {
            const Icon = iconMap[item.icon] || FileText;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.count !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* 3. Engagement Counters Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
          Engagement
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100/80">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Total Likes</span>
            </div>
            <span className="text-xs font-bold text-slate-900">142</span>
          </div>

          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100/80">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Comments</span>
            </div>
            <span className="text-xs font-bold text-slate-900">38</span>
          </div>
        </div>
      </div>

      {/* 4. Campus Network Badge */}
      <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 rounded-xl border border-blue-100/80 p-3.5 shadow-2xs flex items-center gap-2.5">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="text-[11px] text-slate-600 leading-snug">
          <span className="font-semibold text-slate-800 block">Nirma Campus Nexus</span>
          Verified University Community
        </div>
      </div>
    </aside>
  );
}
