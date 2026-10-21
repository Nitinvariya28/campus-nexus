import React from 'react';
import { CATEGORY_HASHTAG_STYLES } from '../../../constants/community/feedCardThemes';

const COLOR_PALETTES = [
  'bg-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100/80',
  'bg-indigo-50 text-indigo-700 border-indigo-200/90 hover:bg-indigo-100/80',
  'bg-purple-50 text-purple-700 border-purple-200/90 hover:bg-purple-100/80',
  'bg-teal-50 text-teal-700 border-teal-200/90 hover:bg-teal-100/80',
  'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100/80',
  'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/80',
  'bg-sky-50 text-sky-700 border-sky-200/90 hover:bg-sky-100/80',
  'bg-violet-50 text-violet-700 border-violet-200/90 hover:bg-violet-100/80',
];

export const getTagStyle = (rawTag, isSelected = false) => {
  if (isSelected) {
    return 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/50 hover:bg-blue-700';
  }
  const normalized = rawTag?.startsWith('#') ? rawTag : `#${rawTag || 'General'}`;
  if (CATEGORY_HASHTAG_STYLES[normalized]) {
    return CATEGORY_HASHTAG_STYLES[normalized];
  }
  // Deterministic palette hash for unknown/custom tags
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
};

/**
 * TagBadge Component
 * Category hashtag chip with deterministic palette generation and consistent visual contrast.
 * When onClick is not provided, renders as non-interactive span with pointer-events-none
 * to allow parent clickable containers (e.g. trending topic rows) to receive click events cleanly.
 */
export default function TagBadge({ tag, onClick, isSelected = false, className = '' }) {
  const normalizedTag = tag?.startsWith('#') ? tag : `#${tag || 'General'}`;
  const styleClass = getTagStyle(normalizedTag, isSelected);

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-2.5 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 w-fit transition-all hover:opacity-90 cursor-pointer border ${styleClass} ${className}`}
      >
        <span>{normalizedTag}</span>
      </button>
    );
  }

  return (
    <span
      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold inline-flex items-center gap-1 w-fit border select-none pointer-events-none ${styleClass} ${className}`}
    >
      <span>{normalizedTag}</span>
    </span>
  );
}
