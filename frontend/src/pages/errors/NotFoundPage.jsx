import React from 'react';
import ErrorCard from '../../components/common/ErrorCard';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <ErrorCard
      code="404"
      title="Page Not Found"
      subtitle="We searched our campus platform records, but the page or resource you requested does not exist or has been relocated."
      icon={Compass}
      badgeBg="bg-amber-50 text-amber-700 border-amber-200"
      iconBg="bg-amber-50 text-amber-600"
      primaryBtnText="Return to Home"
      primaryBtnLink="/"
      secondaryBtnText="Go Back"
    />
  );
}
