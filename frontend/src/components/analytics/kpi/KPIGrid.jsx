import React from 'react';

/**
 * Responsive Metric Cards Grid Container
 * Automatically adapts across mobile (1 col), tablet (2-3 col), desktop (4 col), and XL wide displays (6 col).
 * Handles however many cards (4, 6, 8) are defined for each dashboard without rigid hardcoding.
 */
export default function KPIGrid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {children}
    </div>
  );
}
