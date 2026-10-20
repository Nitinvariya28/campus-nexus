import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home,
  Users, 
  BarChart3, 
  Bell, 
  LogIn, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';
import notificationService from '../../services/notifications/notificationService';
import NotificationDropdown from '../notifications/NotificationDropdown';

export default function Navbar({ hideBrand = false }) {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const isLoginPage = location.pathname === '/login';

  // Poll / fetch live unread notification count
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const data = await notificationService.listNotifications({ limit: 1 });
        if (isMounted) {
          setUnreadCount(data.unread_count || 0);
        }
      } catch (err) {
        // Silently catch to prevent disruption
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, location.pathname]);

  // Derive user initials if avatar is not present
  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase();

  const getAvatarUrl = () => {
    const photo = user?.profile_photo || user?.avatar_url || user?.avatar;
    if (!photo) return null;
    if (typeof photo === 'string' && (photo.startsWith('http://') || photo.startsWith('https://'))) {
      return photo;
    }
    const base = import.meta.env.VITE_BACKEND_MEDIA_URL || 'http://127.0.0.1:8000';
    return `${base}${photo.startsWith('/') ? '' : '/'}${photo}`;
  };
  const avatarUrl = getAvatarUrl();

  const roleDisplay = user?.role === 'ALUMNI' ? 'Alumni' : user?.role === 'PLACEMENT_CELL' ? 'Placement Cell' : 'Student';
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.email?.split('@')[0] || 'Profile');

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Brand Logo & Title (Hidden on Dashboard when Sidebar logo is visible) */}
          <div className="flex items-center space-x-3">
            {!hideBrand && (
              <Link 
                to="/" 
                className="flex items-center space-x-2.5 group"
                title="Return to Home Page"
              >
                <img 
                  src="/logo.svg" 
                  alt="AlumiBridge Logo" 
                  className="w-9 h-9 transition-transform group-hover:scale-105" 
                />
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Alumi<span className="text-amber-500">Bridge</span>
                </span>
              </Link>
            )}
          </div>

          {/* CENTER: Main Navigation Links (Authenticated Only - Desktop) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/community"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <Users className="w-4 h-4" />
                <span>Community</span>
              </NavLink>

              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </NavLink>
            </nav>
          )}

          {/* RIGHT: Actions (Profile and Notifications Only - No Logout) */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Notification Bell with Floating Popover Dropdown (Desktop >= md) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationDropdownOpen((prev) => !prev)}
                    className={`relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                      notificationDropdownOpen ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                    title="Notifications"
                    aria-label="Notifications"
                    aria-expanded={notificationDropdownOpen}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-2xs ring-2 ring-white animate-in zoom-in-50">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationDropdownOpen && (
                    <NotificationDropdown
                      onClose={() => setNotificationDropdownOpen(false)}
                      onUnreadCountChange={(newCount) => setUnreadCount(newCount)}
                    />
                  )}
                </div>

                {/* Profile Button - DIRECT LINK TO /profile (Modern SaaS Profile Pill) */}
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `group flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border transition-all duration-200 ${
                      isActive
                        ? 'border-blue-500/80 bg-blue-50/70 text-blue-900 shadow-2xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/90 text-slate-700 shadow-2xs'
                    }`
                  }
                  title="View Profile & Settings"
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayName} 
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-white/60">
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-col text-left leading-tight pr-0.5">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate max-w-[110px]">
                      {displayName}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 capitalize">
                      {roleDisplay}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </NavLink>
              </>
            ) : (
              /* Unauthenticated Guest State: Exactly 1 CTA Button (Login) - Hidden when already on /login */
              !isLoginPage && (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <LogIn className="w-4 h-4 text-slate-900" />
                  <span>Login</span>
                </Link>
              )
            )}
          </div>

          {/* MOBILE: Hamburger Button */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <NavLink
                to="/notifications"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-600' : ''
                  }`
                }
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-2xs ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          {isAuthenticated ? (
            <>
              {/* Profile Link in Mobile */}
              <NavLink
                to="/profile"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-slate-900 leading-tight">
                    {displayName}
                  </div>
                  <div className="text-xs text-slate-500">{roleDisplay}</div>
                </div>
              </NavLink>

              <div className="border-t border-slate-100 my-1"></div>

              <NavLink
                to="/"
                end
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/community"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Users className="w-5 h-5" />
                <span>Community</span>
              </NavLink>

              <NavLink
                to="/analytics"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </NavLink>

              <NavLink
                to="/notifications"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </NavLink>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                to="/"
                onClick={closeMobile}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>

              {!isLoginPage && (
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="w-full flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm"
                >
                  <LogIn className="w-4 h-4 text-slate-900" />
                  <span>Login to AlumiBridge</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
