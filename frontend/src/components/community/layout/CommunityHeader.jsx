import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FeedFilterTabs from '../feed/FeedFilterTabs';
import { Search, Menu, Loader2, X } from 'lucide-react';
import { searchUsers } from '../../../services/community/communityService';
import RoleBadgePill from '../common/RoleBadgePill';
import { useCommunityFilter } from '../../../context/CommunityFilterContext';

/**
 * UserSearchDropdown Component
 * Floating search bar with live user search and dropdown results.
 */
function UserSearchBox({ onSelectUser, isMobile = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  let filterContext = null;
  try {
    filterContext = useCommunityFilter();
  } catch (e) {
    // optional outside provider
  }

  // Debounced user search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setUserResults([]);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(trimmed);
        setUserResults(results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error searching users:', err);
        setUserResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (userId) => {
    setShowDropdown(false);
    setSearchQuery('');
    if (onSelectUser) {
      onSelectUser(userId);
    } else {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('user', userId);
      navigate(`/community?${nextParams.toString()}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // If there is an exact or single match, select that user
    if (userResults.length === 1) {
      handleSelect(userResults[0].id);
      return;
    }

    // Otherwise navigate to discover with query
    setShowDropdown(false);
    navigate(`/community/discover?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search
          className={`${
            isMobile ? 'w-3.5 h-3.5 left-2.5' : 'w-4 h-4 left-3'
          } text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none`}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setShowDropdown(true);
          }}
          onFocus={() => {
            if (searchQuery.trim().length >= 2) setShowDropdown(true);
          }}
          placeholder={isMobile ? 'Search user, alumni...' : 'Search members, alumni, topics...'}
          className={`w-full ${
            isMobile ? 'pl-8 pr-7 py-1.5' : 'pl-9 pr-9 py-1.5'
          } bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setUserResults([]);
              setShowDropdown(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Floating Dropdown Results */}
      {showDropdown && searchQuery.trim().length >= 2 && (
        <div className="absolute right-0 left-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200/90 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Quick Action: Filter Feed Posts by Topic */}
          <button
            type="button"
            onClick={() => {
              const cleanTag = searchQuery.trim().replace(/^#/, '');
              setShowDropdown(false);
              setSearchQuery('');
              if (filterContext?.selectTag) {
                filterContext.selectTag(cleanTag);
              }
              navigate('/community');
            }}
            className="w-full px-3 py-2 bg-blue-50/70 hover:bg-blue-100/80 border-b border-blue-100 flex items-center justify-between text-left text-xs font-semibold text-blue-700 transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Search className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
              <span>
                Filter feed posts for topic{' '}
                <span className="font-bold underline">
                  #{searchQuery.trim().replace(/^#/, '')}
                </span>
              </span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-200/70 text-blue-800 shrink-0">
              Feed Posts
            </span>
          </button>

          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Matching Members & Mentors</span>
            {isSearching && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
            {userResults.length > 0 ? (
              userResults.map((u) => {
                const initial = u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-blue-50/70 transition-colors text-left cursor-pointer group"
                  >
                    {u.profile_photo ? (
                      <img
                        src={u.profile_photo}
                        alt={u.full_name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate">
                          {u.full_name}
                        </span>
                        <RoleBadgePill role={u.role} className="text-[9px] py-0 px-1" />
                      </div>
                      {(u.current_company || u.department) && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {u.current_company ? u.current_company : ''}
                          {u.current_company && u.department ? ' • ' : ''}
                          {u.department ? u.department : ''}
                        </p>
                      )}
                      {u.skills && u.skills.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {u.skills.slice(0, 3).map((sk, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium group-hover:bg-blue-100/60 group-hover:text-blue-800"
                            >
                              #{sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : !isSearching ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No matching members found for "{searchQuery}". Try searching by skills, companies, or topics.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CommunityHeader Component
 * Sticky Top Community Header (Fixed below main navbar at top-16):
 * - Mobile (< lg): Three-lines (hamburger) button to open Left Sidebar drawer.
 * - Left: 4 Multi-Choice Filter Options ([All] [Student] [Alumni] [Placement Cell])
 *   with horizontal touch-scrolling on mobile.
 * - Right: Search input option with live user search dropdown.
 */
export default function CommunityHeader({
  selectedTypes,
  onSelectionChange,
  onSearch,
  onToggleMobileMenu,
  onSelectUser,
}) {
  return (
    <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 py-2.5 px-3 sm:px-5 rounded-xl shadow-xs mb-4 transition-all">
      {/* DESKTOP & TABLET VIEW (md: and up) */}
      <div className="hidden md:flex md:items-center justify-between gap-4">
        {/* Left Side: 4 Filter Pills in clean single row */}
        <div className="flex items-center gap-2.5 min-w-0">
          <FeedFilterTabs
            selectedTypes={selectedTypes}
            onSelectionChange={onSelectionChange}
          />
        </div>

        {/* Right Side: Search Input with Live User Dropdown */}
        <div className="w-72 lg:w-80 shrink-0">
          <UserSearchBox onSelectUser={onSelectUser} />
        </div>
      </div>

      {/* MOBILE VIEW (< md) */}
      <div className="md:hidden flex flex-col gap-2.5">
        {/* Mobile Row 1: [☰ Activity] Button + Search Input */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/90 transition-colors shrink-0 cursor-pointer shadow-2xs"
            aria-label="Open Activity Menu"
            title="Activity & Views"
          >
            <Menu className="w-4 h-4 text-blue-600" />
            <span>Activity</span>
          </button>

          <div className="flex-1 min-w-0">
            <UserSearchBox onSelectUser={onSelectUser} isMobile={true} />
          </div>
        </div>

        {/* Mobile Row 2: The 4 Filter Options in a Single Clean Horizontal Row (Never Wrap) */}
        <div className="w-full overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          <FeedFilterTabs
            selectedTypes={selectedTypes}
            onSelectionChange={onSelectionChange}
          />
        </div>
      </div>
    </div>
  );
}
