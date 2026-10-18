import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { POST_TYPE_FILTERS } from '../../../constants/community/communityConstants';

/**
 * FeedFilterTabs Component
 * Multiple-choice post-type selection pills:
 * [All] [Student] [Alumni] [Placement Cell]
 *
 * Requirements (AlumiBridge Community Page.docx Section 4.1):
 * - Allow multiple specific post types to be selected simultaneously.
 * - When All is selected, clear other selections.
 * - When a specific post type is selected, deselect All.
 * - If all specific selections are unselected, default back to All.
 * - Zero extra prefix text like "FILTER FEED:".
 */
export default function FeedFilterTabs({ selectedTypes, onSelectionChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Read active filters from URL query parameter if not controlled via props
  const roleParams = searchParams.get('types')?.split(',').filter(Boolean) || [];
  const currentSelected = selectedTypes || (roleParams.length > 0 ? roleParams : ['ALL']);

  const handleToggle = (typeId) => {
    let nextSelected = [];

    if (typeId === 'ALL') {
      nextSelected = ['ALL'];
    } else {
      // Deselect 'ALL' when a specific role is toggled
      const filtered = currentSelected.filter((t) => t !== 'ALL');
      if (filtered.includes(typeId)) {
        nextSelected = filtered.filter((t) => t !== typeId);
      } else {
        nextSelected = [...filtered, typeId];
      }
      // If nothing selected, default back to 'ALL'
      if (nextSelected.length === 0) {
        nextSelected = ['ALL'];
      }
    }

    if (onSelectionChange) {
      onSelectionChange(nextSelected);
    }

    const newParams = new URLSearchParams(searchParams);
    if (nextSelected.includes('ALL')) {
      newParams.delete('types');
    } else {
      newParams.set('types', nextSelected.join(','));
    }

    const queryStr = newParams.toString() ? `?${newParams.toString()}` : '';
    if (location.pathname !== '/community' && location.pathname !== '/community/feed') {
      navigate(`/community${queryStr}`);
    } else {
      setSearchParams(newParams);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
      {POST_TYPE_FILTERS.map((tab) => {
        const isSelected = currentSelected.includes(tab.id);

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleToggle(tab.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer whitespace-nowrap ${
              isSelected
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
