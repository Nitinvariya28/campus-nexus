import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * SearchableFilterSelect Component
 * Modern SaaS typeahead searchable select dropdown (React-Select UX).
 * Features:
 * - Search filter input with instant matching
 * - Selected active indicator with checkmark
 * - Accessible click-outside handling
 * - Keyboard navigation (Esc to close)
 * - Clearable value option
 * - Works identically in both horizontal desktop strip and vertical mobile drawer
 *
 * @param {Array<{value: string, label: string}>} options - Dropdown choices
 * @param {string} value - Currently selected value
 * @param {function} onChange - (value) => void
 * @param {string} placeholder - Default display placeholder
 * @param {string} [className] - Additional wrapper classes
 * @param {boolean} [disabled=false] - Disabled state
 */
export default function SearchableFilterSelect({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option...',
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Selected option label
  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Filtered options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) onChange('');
  };

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full h-8.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between gap-1.5 transition-all text-left truncate ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white text-slate-900 shadow-xs'
            : value
            ? 'border-indigo-300 bg-indigo-50/40 text-indigo-950 hover:bg-white hover:border-indigo-400'
            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex-1 min-w-0">
          {displayLabel}
        </span>

        <div className="flex items-center gap-1 shrink-0 ml-1 text-slate-400">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-slate-200/70 hover:text-slate-700 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[210px] max-w-[320px] bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="px-2 pb-1.5 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search options..."
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Options Scroll List */}
          <ul
            className="max-h-52 overflow-y-auto p-1 space-y-0.5 scrollbar-thin"
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-900'
                    }`}
                  >
                    <span className="truncate min-w-0 pr-2">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-3 text-center text-xs text-slate-400 italic">
                No matching options
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
