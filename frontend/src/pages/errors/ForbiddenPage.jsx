import React from 'react';
import ErrorCard from '../../components/common/ErrorCard';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <ErrorCard
      code="403"
      title="Access Restricted"
      subtitle="You do not have the required role or authorization level (Student, Alumni, Placement Cell, or Admin) to access this protected area."
      icon={ShieldAlert}
      badgeBg="bg-red-50 text-red-700 border-red-200"
      iconBg="bg-red-50 text-red-600"
      primaryBtnText="Go to Community"
      primaryBtnLink="/community"
      secondaryBtnText="Go Back"
    />
  );
}
