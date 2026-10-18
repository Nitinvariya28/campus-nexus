import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Briefcase, ChevronDown, Check, X, Search, Sparkles } from 'lucide-react';

const DEFAULT_POPULAR_ROLES = [
  'Software Development Engineer (SDE)',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Cloud Solutions Architect',
  'Product Manager',
  'UI/UX Designer',
  'Cybersecurity Analyst',
  'Quality Assurance (QA) / SDET',
  'Data Analyst / Business Analyst',
  'Mobile Application Developer (iOS/Android)',
  'Embedded Systems Engineer',
];

/**
 * RoleCombobox
 * Autocomplete searchable dropdown with company-specific role suggestions,
 * campus role presets, and support for freeform custom role names.
 */
export default function RoleCombobox({
  companyId,
  companyRoles = [],
  commonRoles = DEFAULT_POPULAR_ROLES,
  selectedRoleId = null,
  roleTitle = '',
  onChange,
  placeholder = 'Select or type target role (e.g. SDE-1, Data Analyst)...',
  disabled = false,
  hasError = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(roleTitle || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal search term when parent roleTitle changes
  useEffect(() => {
    setSearchTerm(roleTitle || '');
  }, [roleTitle]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filter company-specific roles
  const relevantCompanyRoles = useMemo(() => {
    if (!companyId || !Array.isArray(companyRoles)) return [];
    const numId = parseInt(companyId, 10);
    return companyRoles.filter((r) => r.company_id === numId);
  }, [companyId, companyRoles]);

  // Filter lists based on search term
  const filteredCompanyRoles = useMemo(() => {
    if (!searchTerm.trim()) return relevantCompanyRoles;
    const lower = searchTerm.toLowerCase();
    return relevantCompanyRoles.filter((r) => r.role_name.toLowerCase().includes(lower));
  }, [relevantCompanyRoles, searchTerm]);

  const allCommonRoles = useMemo(() => {
    return Array.isArray(commonRoles) && commonRoles.length > 0
      ? commonRoles
      : DEFAULT_POPULAR_ROLES;
  }, [commonRoles]);

  const filteredCommonRoles = useMemo(() => {
    if (!searchTerm.trim()) return allCommonRoles;
    const lower = searchTerm.toLowerCase();
    return allCommonRoles.filter((r) => r.toLowerCase().includes(lower));
  }, [allCommonRoles, searchTerm]);

  const handleSelectRole = (title, id = null) => {
    setSearchTerm(title);
    setIsOpen(false);
    onChange?.({
      roleId: id,
      roleTitle: title,
    });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    onChange?.({
      roleId: null, // Reset ID if custom typed
      roleTitle: val,
    });
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchTerm('');
    onChange?.({
      roleId: null,
      roleTitle: '',
    });
    inputRef.current?.focus();
  };

  const hasMatches = filteredCompanyRoles.length > 0 || filteredCommonRoles.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-white transition-all shadow-2xs ${
          hasError
            ? 'border-red-400 ring-2 ring-red-100'
            : isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setIsOpen(false);
            }
          }}
        />

        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm transition-colors cursor-pointer"
            title="Clear role"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm transition-colors cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Company-Specific Roles Section */}
          {filteredCompanyRoles.length > 0 && (
            <div className="mb-2">
              <div className="px-2.5 py-1 text-3xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Company-Specific Roles</span>
              </div>
              <div className="space-y-0.5">
                {filteredCompanyRoles.map((role) => {
                  const isSelected = searchTerm.toLowerCase() === role.role_name.toLowerCase();
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleSelectRole(role.role_name, role.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{role.role_name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Common Campus Roles Section */}
          {filteredCommonRoles.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-3xs font-bold uppercase tracking-wider text-slate-400">
                Popular Campus Roles
              </div>
              <div className="space-y-0.5">
                {filteredCommonRoles.map((roleName) => {
                  const isSelected = searchTerm.toLowerCase() === roleName.toLowerCase();
                  return (
                    <button
                      key={roleName}
                      type="button"
                      onClick={() => handleSelectRole(roleName, null)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{roleName}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback if no matching presets */}
          {!hasMatches && searchTerm.trim() && (
            <div className="p-3 text-center">
              <p className="text-xs text-slate-500">
                Use custom role: <span className="font-semibold text-slate-800">"{searchTerm}"</span>
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-1.5 text-2xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium hover:bg-blue-100"
              >
                Confirm Custom Role
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
