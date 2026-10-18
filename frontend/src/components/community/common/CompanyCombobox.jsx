import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Building2, Check, Plus, X, ChevronDown } from 'lucide-react';

/**
 * CompanyCombobox
 * Searchable, lightweight dropdown combobox for selecting or creating companies.
 * Replaces cumbersome native select menus with a clean, scroll-limited popup.
 */
export default function CompanyCombobox({
  companies = [],
  selectedCompanyId = '',
  newCompanyName = '',
  onChange,
  placeholder = 'Search or select company (e.g. Google, Amazon)...',
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find currently selected company name
  const selectedCompany = useMemo(() => {
    if (newCompanyName) {
      return { id: 'CUSTOM', name: newCompanyName, isCustom: true };
    }
    if (selectedCompanyId) {
      return companies.find((c) => String(c.id) === String(selectedCompanyId));
    }
    return null;
  }, [companies, selectedCompanyId, newCompanyName]);

  // Filter companies by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) {
      return companies.slice(0, 15);
    }
    const q = searchQuery.toLowerCase();
    return companies
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [companies, searchQuery]);

  // Check if query exactly matches an existing company
  const exactMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    return companies.some((c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase());
  }, [companies, searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCompany = (company) => {
    onChange?.({
      companyId: company.id,
      newCompanyName: '',
      isCustom: false,
    });
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleCreateNewCompany = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    onChange?.({
      companyId: '',
      newCompanyName: trimmed,
      isCustom: true,
    });
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.({
      companyId: '',
      newCompanyName: '',
      isCustom: false,
    });
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Box / Trigger */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          {selectedCompany ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="font-semibold text-slate-900 truncate">
                {selectedCompany.name}
              </span>
              {selectedCompany.isCustom && (
                <span className="px-1.5 py-0.5 rounded text-3xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  New
                </span>
              )}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full bg-transparent border-none p-0 text-sm placeholder:text-slate-400 focus:outline-hidden"
            />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedCompany && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear company"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden animate-in fade-in-50 duration-150">
          {/* Inner Search Box if already selected */}
          {selectedCompany && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to switch company..."
                  className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* List Options (Max height scrollable) */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50 py-1">
            {filtered.length > 0 ? (
              filtered.map((company) => {
                const isSelected =
                  String(selectedCompanyId) === String(company.id) && !newCompanyName;
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelectCompany(company)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{company.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-slate-400">
                No matching verified company found
              </div>
            )}

            {/* Custom Company Option */}
            {searchQuery.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreateNewCompany}
                className="w-full px-3 py-2.5 text-left text-xs font-semibold text-blue-700 bg-blue-50/50 hover:bg-blue-100/70 border-t border-blue-100 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add "{searchQuery.trim()}" as custom company</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
