import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function CommunityFeedPage() {
  return (
    <PlaceholderCard
      moduleName="Community"
      title="Polymorphic Community Stream"
      route="/community"
      description="Unified feed merging 4 entity types: Standard Posts, Career Opportunities, Campus Announcements, and Interview Debriefs. Includes limit-offset pagination, keyword multi-search, and tag filters."
      endpoints={[
        "GET /api/community/feed/ (Polymorphic feed with pagination & ?role= filters)",
        "GET /api/community/feed/search/?q=<term> (Feed search across all 4 entity types)",
        "POST /api/community/posts/<id>/toggle-like/ (Toggle like state)",
        "POST /api/community/posts/<id>/toggle-bookmark/ (Toggle bookmark state)"
      ]}
    />
  );
}
