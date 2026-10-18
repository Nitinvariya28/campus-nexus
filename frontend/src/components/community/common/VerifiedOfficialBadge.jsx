import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * VerifiedOfficialBadge Component
 * Golden verified badge for Placement Cell and University Officials.
 */
export default function VerifiedOfficialBadge({ label = 'Official', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs ${className}`}
      title="Verified Institutional Authority"
    >
      <ShieldCheck className="w-3 h-3 text-amber-600" />
      <span>{label}</span>
    </span>
  );
}
