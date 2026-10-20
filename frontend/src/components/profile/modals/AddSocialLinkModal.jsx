import React, { useState, useMemo } from 'react';
import { X, Globe, Check, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AddSocialLinkModal Component
 * Interactive visual social platform selector with card chips and dynamic URL placeholders.
 * Strictly zero dummy data - populated from database options.
 */
export default function AddSocialLinkModal({ isOpen, onClose, options, existingPlatforms = [], onAdd }) {
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');

  const rawPlatforms = options?.basic_profile_form?.social_platforms || [
    { value: 'LINKEDIN', display_name: 'LinkedIn' },
    { value: 'GITHUB', display_name: 'GitHub' },
    { value: 'PORTFOLIO', display_name: 'Portfolio Website' },
    { value: 'LEETCODE', display_name: 'LeetCode' },
    { value: 'KAGGLE', display_name: 'Kaggle' },
    { value: 'OTHER', display_name: 'Other' },
  ];

  const socialPlatforms = useMemo(() => {
    return rawPlatforms.map((sp) => {
      if (typeof sp === 'object' && sp !== null) {
        return {
          value: sp.value || sp.platform || '',
          display_name: sp.display_name || sp.label || sp.value || sp.platform || '',
        };
      }
      return { value: String(sp), display_name: String(sp) };
    });
  }, [rawPlatforms]);

  const existingSet = useMemo(() => {
    return new Set(
      existingPlatforms.map((p) => (typeof p === 'object' && p !== null ? p.platform : p))
    );
  }, [existingPlatforms]);

  const getPlaceholder = (code) => {
    switch (code) {
      case 'LINKEDIN':
        return 'https://linkedin.com/in/username';
      case 'GITHUB':
        return 'https://github.com/username';
      case 'LEETCODE':
        return 'https://leetcode.com/username';
      case 'KAGGLE':
        return 'https://kaggle.com/username';
      case 'PORTFOLIO':
        return 'https://yourportfolio.dev';
      default:
        return 'https://...';
    }
  };

  if (!isOpen) return null;

  const handleSelectPlatform = (val) => {
    if (existingSet.has(val)) {
      toast.error('This social profile has already been added.');
      return;
    }
    setPlatform(val);
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!platform) {
      toast.error('Please select a platform.');
      return;
    }
    if (!url.trim()) {
      toast.error('Please enter the profile URL.');
      return;
    }

    onAdd({
      platform,
      url: url.trim(),
    });

    setPlatform('');
    setUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Add Social Link</h3>
              <p className="text-xs text-slate-500 mt-0.5">Showcase your coding profiles and online portfolio</p>
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
        <form onSubmit={handleSaveSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              {socialPlatforms.map((sp) => {
                const isSelected = platform === sp.value;
                const isAdded = existingSet.has(sp.value);

                return (
                  <button
                    key={sp.value}
                    type="button"
                    disabled={isAdded}
                    onClick={() => handleSelectPlatform(sp.value)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all ${
                      isAdded
                        ? 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200/90 text-slate-700 hover:border-blue-300 hover:bg-blue-50/20'
                    }`}
                  >
                    <span className="truncate">{sp.display_name}</span>
                    {isAdded ? (
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 shrink-0">
                        Added
                      </span>
                    ) : isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* URL Input with Dynamic Placeholder */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Profile URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={getPlaceholder(platform)}
                className="w-full bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                required
              />
            </div>
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
              disabled={!platform || !url.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 ${
                platform && url.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Save Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
