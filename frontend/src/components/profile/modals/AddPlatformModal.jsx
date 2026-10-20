import React, { useState, useMemo } from 'react';
import { X, BookOpen, Search, Check, AlertCircle, PlusCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AddPlatformModal Component
 * Interactive continuous learning platform selector with card chips,
 * category filters, and custom resource input.
 * Strictly zero dummy data - dynamically populated from database options.
 */
export default function AddPlatformModal({ isOpen, onClose, options, existingPlatforms = [], onAdd }) {
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [otherPlatformName, setOtherPlatformName] = useState('');
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const groupedPlatforms = options?.learning_habits_form?.top_10_grouped_platforms || [];

  // Flatten all platforms to easily locate selected
  const { allPlatforms, platformTypes } = useMemo(() => {
    const list = [];
    const types = new Set();

    groupedPlatforms.forEach((group) => {
      const typeLabel = group.platform_type || 'General';
      types.add(typeLabel);

      (group.items || []).forEach((item) => {
        list.push({
          id: item.id,
          name: item.name,
          type: typeLabel,
        });
      });
    });

    return {
      allPlatforms: list,
      platformTypes: Array.from(types),
    };
  }, [groupedPlatforms]);

  const existingIds = useMemo(() => {
    return new Set(existingPlatforms.map((p) => Number(p.platform_id || p.id)));
  }, [existingPlatforms]);

  const filteredPlatforms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allPlatforms;
    return allPlatforms.filter(
      (p) => p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
    );
  }, [allPlatforms, searchQuery]);

  const selectedPlatform = useMemo(() => {
    if (selectedPlatformId === 'OTHER') {
      return { id: 'OTHER', name: otherPlatformName || 'Custom Platform', type: 'Custom' };
    }
    return allPlatforms.find((p) => String(p.id) === String(selectedPlatformId));
  }, [allPlatforms, selectedPlatformId, otherPlatformName]);

  if (!isOpen) return null;

  const handleSelect = (platformId) => {
    if (platformId !== 'OTHER' && existingIds.has(Number(platformId))) {
      toast.error('This platform is already connected.');
      return;
    }
    setSelectedPlatformId(platformId);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();

    if (!selectedPlatformId) {
      toast.error('Please select a learning platform.');
      return;
    }

    if (selectedPlatformId === 'OTHER' && !otherPlatformName.trim()) {
      toast.error('Please specify the custom platform name.');
      return;
    }

    if (selectedPlatformId === 'OTHER') {
      onAdd({
        other_platform_name: otherPlatformName.trim(),
        platform_name: otherPlatformName.trim(),
        url: url.trim(),
      });
    } else {
      const matched = allPlatforms.find((p) => String(p.id) === String(selectedPlatformId));
      onAdd({
        platform_id: Number(selectedPlatformId),
        platform_name: matched ? matched.name : 'Learning Platform',
        url: url.trim(),
      });
    }

    setSelectedPlatformId('');
    setOtherPlatformName('');
    setUrl('');
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Add Learning Resource</h3>
              <p className="text-xs text-slate-500 mt-0.5">Attach certifications, video courses, or coding profiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveSubmit} className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search platform (e.g. LeetCode, Coursera, YouTube)..."
              className="w-full bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Interactive Platform Cards Grid */}
          <div className="flex-1 min-h-[140px] max-h-[200px] overflow-y-auto border border-slate-200/80 rounded-xl p-2 bg-slate-50/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredPlatforms.map((p) => {
                const isSelected = String(p.id) === String(selectedPlatformId);
                const isAlreadyAdded = existingIds.has(Number(p.id));

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleSelect(p.id)}
                    className={`flex items-center justify-between text-left p-2.5 rounded-lg border transition-all text-xs ${
                      isAlreadyAdded
                        ? 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200/80 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="truncate pr-1">
                      <div className="font-medium truncate">{p.name}</div>
                      <span className="text-[10px] text-slate-400 block truncate">{p.type}</span>
                    </div>

                    {isAlreadyAdded ? (
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 shrink-0">
                        Added
                      </span>
                    ) : isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : null}
                  </button>
                );
              })}

              {/* + Other Option Card */}
              <button
                type="button"
                onClick={() => handleSelect('OTHER')}
                className={`flex items-center justify-between text-left p-2.5 rounded-lg border transition-all text-xs ${
                  selectedPlatformId === 'OTHER'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500 shadow-2xs'
                    : 'bg-white border-dashed border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div className="truncate pr-1">
                  <div className="font-medium flex items-center gap-1.5 text-blue-700">
                    <PlusCircle className="w-3.5 h-3.5" /> Other Resource
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">Custom platform or website</span>
                </div>
                {selectedPlatformId === 'OTHER' && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Conditional Custom Name Input if OTHER */}
          {selectedPlatformId === 'OTHER' && (
            <div className="animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Platform Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={otherPlatformName}
                onChange={(e) => setOtherPlatformName(e.target.value)}
                placeholder="e.g. Frontend Masters, MIT OpenCourseWare, Udemy..."
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>
          )}

          {/* Resource / Course URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resource or Profile URL <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedPlatformId || (selectedPlatformId === 'OTHER' && !otherPlatformName.trim())}
              className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 ${
                selectedPlatformId && (selectedPlatformId !== 'OTHER' || otherPlatformName.trim())
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Add Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
