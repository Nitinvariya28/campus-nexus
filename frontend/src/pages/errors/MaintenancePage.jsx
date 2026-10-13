import React from 'react';
import ErrorCard from '../../components/common/ErrorCard';
import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <ErrorCard
      code="503"
      title="Scheduled Maintenance"
      subtitle="AlumiBridge is currently undergoing scheduled platform improvements to optimize campus placement databases. We will be back online shortly."
      icon={Wrench}
      badgeBg="bg-purple-50 text-purple-700 border-purple-200"
      iconBg="bg-purple-50 text-purple-600"
      primaryBtnText="Refresh Status"
      primaryBtnLink="#"
      secondaryBtnText="Return to Home"
      onSecondaryClick={() => window.location.href = "/"}
      action={
        <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs text-purple-800">
          Estimated completion: Within the next 30 minutes. Thank you for your patience!
        </div>
      }
    />
  );
}
