import React from 'react';
import { ROLE_BADGE_STYLES } from '../../../constants/community/feedCardThemes';
import { ROLE_LABELS } from '../../../constants/community/communityConstants';

/**
 * RoleBadgePill Component
 * Standardized semantic role indicator pill across community UI.
 * Matches exact geometry and tokens from COMMUNITY_UI_THEME_AND_DESIGN_SYSTEM.md
 */
export default function RoleBadgePill({ role = 'STUDENT', className = '' }) {
  const normalizedRole = (role || 'STUDENT').toUpperCase();
  const styleClass = ROLE_BADGE_STYLES[normalizedRole] || ROLE_BADGE_STYLES.STUDENT;
  const label = ROLE_LABELS[normalizedRole] || normalizedRole;

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center border ${styleClass} ${className}`}
    >
      {label}
    </span>
  );
}
