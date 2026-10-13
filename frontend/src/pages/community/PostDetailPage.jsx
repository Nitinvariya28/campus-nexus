import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function PostDetailPage() {
  return (
    <PlaceholderCard
      moduleName="Community"
      title="Post Detail & Discussions"
      route="/community/posts/:id"
      description="Deep view of a single post entity with author profile details, media attachments, full round details for interviews, and paginated comments discussion thread."
      endpoints={[
        "GET /api/community/posts/<id>/?type=<TYPE> (Detailed entity representation)",
        "GET /api/community/posts/<id>/comments/ (Paginated comment thread)",
        "POST /api/community/posts/<id>/comments/ (Create comment)"
      ]}
    />
  );
}
