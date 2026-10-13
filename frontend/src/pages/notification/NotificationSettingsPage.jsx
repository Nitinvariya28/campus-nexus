import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function NotificationSettingsPage() {
  return (
    <PlaceholderCard
      moduleName="Notifications"
      title="Notification Preferences"
      route="/notifications/settings"
      description="Configure email alerts for high-priority placement opportunities, new direct messages, mention notifications, and weekly campus digest."
      endpoints={[]}
    />
  );
}
