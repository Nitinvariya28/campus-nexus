import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function BookmarksPage() {
  return (
    <PlaceholderCard
      moduleName="Community"
      title="Saved Posts & Bookmarks"
      route="/community/bookmarks"
      description="Personal repository of bookmarked opportunities, guidance articles, and interview experiences saved by the user for later reference."
      endpoints={[
        "GET /api/community/bookmarks/ (Paginated list of user bookmarked items)"
      ]}
    />
  );
}
