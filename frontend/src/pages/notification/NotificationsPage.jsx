import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function NotificationsPage() {
  return (
    <PlaceholderCard
      moduleName="Notifications"
      title="In-App Alerts & Activity Stream"
      route="/notifications"
      description="Real-time alert center tracking new opportunities, announcement publications, comment mentions, interview feedback, and moderation report status. Includes bulk mark-as-read."
      endpoints={[
        "GET /api/notifications/ (Paginated alerts feed strictly scoped to logged-in user)",
        "PATCH /api/notifications/<id>/read/ (Idempotent mark single alert as read)",
        "POST /api/notifications/read-all/ (Bulk mark all alerts read in single query)"
      ]}
    />
  );
}
