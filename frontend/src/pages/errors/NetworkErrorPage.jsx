import React from 'react';
import ErrorCard from '../../components/common/ErrorCard';
import { WifiOff, RotateCcw } from 'lucide-react';

export default function NetworkErrorPage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <ErrorCard
      code="Offline"
      title="No Internet Connection"
      subtitle="You appear to be disconnected from the internet. Please check your Wi-Fi, campus hotspot, or mobile data connection to continue."
      icon={WifiOff}
      badgeBg="bg-slate-100 text-slate-700 border-slate-300"
      iconBg="bg-slate-100 text-slate-600"
      primaryBtnText="Retry Connection"
      primaryBtnLink="#"
      secondaryBtnText="Return to Home"
      onSecondaryClick={() => window.location.href = "/"}
      action={
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Click to Reconnect</span>
        </button>
      }
    />
  );
}
