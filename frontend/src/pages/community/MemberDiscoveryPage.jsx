import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import CommunityLayout from '../../components/community/layout/CommunityLayout';
import {
  Compass,
  Search,
  ArrowLeft,
  Users,
  Building2,
  GraduationCap,
  Loader2,
  AlertCircle,
  X,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { searchUsers } from '../../services/community/communityService';
import RoleBadgePill from '../../components/community/common/RoleBadgePill';
import VerifiedOfficialBadge from '../../components/community/common/VerifiedOfficialBadge';
import AuthorAvatar from '../../components/community/common/AuthorAvatar';

/**
 * MemberDiscoveryPage Component
 * Full-page member and alumni search directory (/community/discover?q=...).
 * Handles empty queries, loading states, API errors, and clear "No members found" states.
 */
export default function MemberDiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryFromUrl = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(queryFromUrl);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync input value when URL param changes
  useEffect(() => {
    setInputValue(queryFromUrl);
  }, [queryFromUrl]);

  // Execute search when URL query changes
  useEffect(() => {
    const trimmed = queryFromUrl.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setHasSearched(false);
      return;
    }

    let isMounted = true;
    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      try {
        const data = await searchUsers(trimmed);
        if (isMounted) {
          setResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Member search error:', err);
          setError('Failed to fetch members. Please try again.');
          setResults([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [queryFromUrl]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setInputValue('');
    setSearchParams({});
  };

  const handleUserClick = (userId) => {
    navigate(`/community?user=${userId}`);
  };

  return (
    <CommunityLayout>
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6">
        {/* Header Row */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Member Discovery</h1>
              <p className="text-xs text-slate-500">
                Explore verified students, alumni mentors, and institutional coordinators.
              </p>
            </div>
          </div>
          <Link
            to="/community"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Feed</span>
          </Link>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search members by name, company, department, or skills & topics (e.g. #SystemDesign, Python)..."
            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {inputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* State 1: Loading Spinner */}
        {isLoading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Searching university community directory...</p>
          </div>
        )}

        {/* State 2: Error State */}
        {!isLoading && error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setSearchParams({ q: queryFromUrl })}
              className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg font-semibold hover:bg-rose-100 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* State 3: Empty Query Initial Guide */}
        {!isLoading && !error && !hasSearched && (
          <div className="py-12 px-4 text-center space-y-3 bg-slate-50/60 rounded-xl border border-slate-200/60">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Search Nirma University Members</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Find peers, alumni working in top tech companies, and mentors. Type a name, department, or company in the box above to get started.
            </p>
          </div>
        )}

        {/* State 4: "No members found" Empty Results Feedback */}
        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="py-12 px-4 text-center space-y-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No members found matching "{queryFromUrl}"
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              We couldn't find any student, alumni, or placement member matching your search query. Try checking your spelling or searching with broader keywords like "CSE" or "Engineer".
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Search</span>
              </button>
            </div>
          </div>
        )}

        {/* State 5: Search Results Grid */}
        {!isLoading && !error && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Found <strong className="text-slate-800">{results.length}</strong> matching {results.length === 1 ? 'member' : 'members'}</span>
              <span className="text-2xs uppercase tracking-wider font-semibold">Live Database</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {results.map((member) => {
                const authorPayload = {
                  id: member.id,
                  name: member.full_name,
                  avatar: member.profile_photo,
                  role: member.role,
                };

                return (
                  <div
                    key={member.id}
                    onClick={() => handleUserClick(member.id)}
                    className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <AuthorAvatar
                        author={authorPayload}
                        size="md"
                        className="ring-2 ring-slate-100 group-hover:ring-blue-400 transition-all shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {member.full_name}
                          </h4>
                          {member.is_verified && <VerifiedOfficialBadge />}
                          {member.role && (
                            <RoleBadgePill role={member.role} className="text-[10px] py-0 px-1.5" />
                          )}
                        </div>

                        {member.headline && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                            {member.headline}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-2 flex-wrap text-2xs text-slate-500">
                          {member.department && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                              <GraduationCap className="w-3 h-3 text-slate-400" />
                              <span>{member.department}</span>
                            </span>
                          )}
                          {member.company && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50/60 text-blue-700 border border-blue-200/60 font-medium">
                              <Building2 className="w-3 h-3 text-blue-500" />
                              <span>{member.company}</span>
                            </span>
                          )}
                        </div>

                        {member.skills && member.skills.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            {member.skills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium"
                              >
                                #{skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-2xs text-slate-400 truncate max-w-[180px]">
                        {member.email}
                      </span>
                      <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                        <span>View Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </CommunityLayout>
  );
}
