import React from 'react';

/**
 * Footer Component
 * Reuses the authentic footer design from the authentication phase.
 * Positioned in-flow at the very bottom of the scrollable analysis area.
 */
export default function Footer() {
  return (
    <footer className="mt-12 py-6 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center space-x-2">
        <img src="/logo.svg" alt="AlumiBridge" className="w-5 h-5" />
        <span className="font-semibold text-slate-700">AlumiBridge</span>
        <span>·</span>
        <span>Nirma University Campus Nexus</span>
      </div>
      <div>
        <p>© 2026 AlumiBridge. All rights reserved.</p>
      </div>
    </footer>
  );
}
