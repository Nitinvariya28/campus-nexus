import React from 'react';
import StandardPostCard from './cards/StandardPostCard';
import InterviewExperienceCard from './cards/InterviewExperienceCard';
import OpportunityCard from './cards/OpportunityCard';
import AnnouncementCard from './cards/AnnouncementCard';

/**
 * PolymorphicFeedCard Component
 * Dynamic dispatcher that inspects item.feed_type and renders the corresponding
 * specialized card component (POST, INTERVIEW_EXPERIENCE, OPPORTUNITY, ANNOUNCEMENT).
 */
export default function PolymorphicFeedCard({
  item,
  onLikeToggle,
  onBookmarkToggle,
  onCommentClick,
}) {
  if (!item) return null;

  const feedType = (item.feed_type || item.entity_type || 'POST').toUpperCase();

  switch (feedType) {
    case 'INTERVIEW_EXPERIENCE':
      return <InterviewExperienceCard post={item} />;

    case 'OPPORTUNITY':
      return <OpportunityCard post={item} />;

    case 'ANNOUNCEMENT':
      return <AnnouncementCard post={item} />;

    case 'POST':
    case 'STANDARD_POST':
    default:
      return (
        <StandardPostCard
          post={item}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
          onCommentClick={onCommentClick}
        />
      );
  }
}
