import React from 'react';

/**
 * Responsive Metric Cards Grid Container
 * Automatically adapts across mobile (1 col), tablet (2-3 col), and desktop / wide displays (3 to 6 col).
 * Uses balanced gap-3.5 to give multi-column cards maximum inner breathing room.
 */
export default function KPIGrid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {children}
    </div>
  );
}
