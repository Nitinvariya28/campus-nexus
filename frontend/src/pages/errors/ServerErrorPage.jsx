import React from 'react';
import ErrorCard from '../../components/common/ErrorCard';
import { ServerCrash } from 'lucide-react';

export default function ServerErrorPage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <ErrorCard
      code="500"
      title="Something Went Wrong"
      subtitle="Our server encountered an unexpected error while processing your request. Our engineering team has been notified. Please try refreshing."
      icon={ServerCrash}
      badgeBg="bg-rose-50 text-rose-700 border-rose-200"
      iconBg="bg-rose-50 text-rose-600"
      primaryBtnText="Return to Home"
      primaryBtnLink="/"
      secondaryBtnText="Retry Request"
      onSecondaryClick={handleReload}
    />
  );
}
