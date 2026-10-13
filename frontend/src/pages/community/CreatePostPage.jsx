import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function CreatePostPage() {
  return (
    <PlaceholderCard
      moduleName="Community"
      title="Create Post / Opportunity / Announcement"
      route="/community/create"
      description="Polymorphic post publishing form with strict role enforcement: Students can post general queries, Alumni can share opportunities and interview logs, Placement Officers can publish official drives."
      endpoints={[
        "GET /api/community/posts/options/ (Fetch departments, companies, tags for creation dropdowns)",
        "POST /api/community/posts/ (Universal gateway for STANDARD_POST, OPPORTUNITY, ANNOUNCEMENT, INTERVIEW_EXPERIENCE)"
      ]}
    />
  );
}
