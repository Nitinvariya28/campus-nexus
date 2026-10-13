import React from 'react';
import ErrorCard from '../../components/common/ErrorCard';
import { LockKeyhole } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <ErrorCard
      code="401"
      title="Session Expired"
      subtitle="Your active login session has expired or you must sign in first to access this protected section of AlumiBridge."
      icon={LockKeyhole}
      badgeBg="bg-blue-50 text-blue-700 border-blue-200"
      iconBg="bg-blue-50 text-blue-600"
      primaryBtnText="Sign In to Continue"
      primaryBtnLink="/login"
      secondaryBtnText="Return to Home"
      onSecondaryClick={() => window.location.href = "/"}
    />
  );
}
