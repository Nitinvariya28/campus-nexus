import React from 'react';
import { CATEGORY_HASHTAG_STYLES } from '../../../constants/community/feedCardThemes';

/**
 * TagBadge Component
 * Category hashtag chip adhering to Section 4 of COMMUNITY_UI_THEME_AND_DESIGN_SYSTEM.md
 */
export default function TagBadge({ tag, onClick, className = '' }) {
  const normalizedTag = tag?.startsWith('#') ? tag : `#${tag || 'General'}`;
  const styleClass =
    CATEGORY_HASHTAG_STYLES[normalizedTag] || 'bg-slate-100 text-slate-700 border border-slate-200';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold inline-flex items-center w-fit transition-colors ${
        onClick ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
      } ${styleClass} ${className}`}
    >
      {normalizedTag}
    </button>
  );
}
