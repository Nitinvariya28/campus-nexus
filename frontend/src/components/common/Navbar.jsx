import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  BarChart3, 
  Bell, 
  LogIn, 
  Menu, 
  X,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, toggleDevAuth } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive user initials if avatar is not present
  const initials = user
    ? `${user.first_name?.[0] || 'U'}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  const avatarUrl = user?.avatar
    ? `${import.meta.env.VITE_BACKEND_MEDIA_URL || 'http://127.0.0.1:8000'}${user.avatar}`
    : null;

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Brand Logo & Title (Always Navigates to Home Page '/') */}
          <div className="flex items-center space-x-3">
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
          </div>

          {/* CENTER: Main Navigation Links (Authenticated Only - Desktop) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
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

          {/* RIGHT: Actions */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Dev Mode Auth Switch */}
            <button
              onClick={toggleDevAuth}
              title={`Click to switch to ${isAuthenticated ? 'Guest (Logged Out)' : 'Authenticated (Logged In)'} mode`}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {isAuthenticated ? (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Dev: Logged In</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Dev: Guest</span>
                </>
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    `relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : ''
                    }`
                  }
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </NavLink>

                {/* Profile Button - DIRECT LINK TO /profile (NO DROPDOWN) */}
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-lg border transition-all ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`
                  }
                  title="View Profile"
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={user?.first_name || 'Profile'} 
                      className="w-7 h-7 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-slate-800">
                    {user?.first_name || 'Profile'}
                  </span>
                </NavLink>
              </>
            ) : (
              /* Unauthenticated Guest State: Exactly 1 CTA Button (Login) */
              <Link
                to="/login"
                className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <LogIn className="w-4 h-4 text-slate-900" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* MOBILE: Hamburger Button */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Quick dev switch on mobile */}
            <button
              onClick={toggleDevAuth}
              className="p-1.5 text-xs rounded border border-slate-200 bg-slate-50 text-slate-600"
              title="Toggle Auth State"
            >
              {isAuthenticated ? 'Dev:In' : 'Dev:Out'}
            </button>

            {isAuthenticated && (
              <NavLink
                to="/notifications"
                onClick={closeMobile}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
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
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center">
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs text-slate-500">{user?.role || 'Student'}</div>
                </div>
              </NavLink>

              <div className="border-t border-slate-100 my-1"></div>

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
            </>
          ) : (
            <div className="pt-2">
              <Link
                to="/login"
                onClick={closeMobile}
                className="w-full flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm"
              >
                <LogIn className="w-4 h-4 text-slate-900" />
                <span>Login to AlumiBridge</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
