import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { POST_TYPE_FILTERS } from '../../../constants/community/communityConstants';

/**
 * FeedFilterTabs Component
 * Multiple-choice post-type selection pills:
 * [All] [Student] [Alumni] [Placement Cell]
 *
 * Rules:
 * - When All is selected, individual options are cleared.
 * - When a specific option is clicked, All is deselected.
 * - If ALL specific options are selected (Student + Alumni + Placement Cell),
 *   automatically remove all specific options and revert directly to [All]!
 * - If all specific options are deselected, default back to [All].
 */
const SPECIFIC_ROLES = ['STUDENT', 'ALUMNI', 'PLACEMENT_CELL'];

export default function FeedFilterTabs({ selectedTypes, onSelectionChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Read active filters from URL query parameter if not controlled via props
  const roleParams = searchParams.get('types')?.split(',').filter(Boolean) || [];
  const rawSelected = selectedTypes || (roleParams.length > 0 ? roleParams : ['ALL']);

  // If all specific roles are currently present in URL/state, treat as effective ALL
  const isAllActive =
    rawSelected.includes('ALL') ||
    SPECIFIC_ROLES.every((role) => rawSelected.includes(role));

  const handleToggle = (typeId) => {
    let nextSelected = [];

    if (typeId === 'ALL') {
      nextSelected = ['ALL'];
    } else {
      // If currently ALL was active, start fresh with only non-ALL options
      const prevWithoutAll = isAllActive ? [] : rawSelected.filter((t) => t !== 'ALL');

      let updated = [];
      if (prevWithoutAll.includes(typeId)) {
        updated = prevWithoutAll.filter((t) => t !== typeId);
      } else {
        updated = [...prevWithoutAll, typeId];
      }

      // If all 3 specific roles are now selected -> automatically clear and revert to ALL
      const hasAllSpecific = SPECIFIC_ROLES.every((r) => updated.includes(r));

      if (hasAllSpecific || updated.length === 0) {
        nextSelected = ['ALL'];
      } else {
        nextSelected = updated;
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
        let isSelected = false;
        if (tab.id === 'ALL') {
          isSelected = isAllActive;
        } else {
          isSelected = !isAllActive && rawSelected.includes(tab.id);
        }

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
