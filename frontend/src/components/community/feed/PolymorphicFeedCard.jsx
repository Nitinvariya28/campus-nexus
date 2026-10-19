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
  isManageMode = false,
  onEdit,
  onDelete,
  onUserClick,
}) {
  if (!item) return null;

  const feedType = (item.feed_type || item.entity_type || 'POST').toUpperCase();

  switch (feedType) {
    case 'INTERVIEW_EXPERIENCE':
      return (
        <InterviewExperienceCard
          post={item}
          isManageMode={isManageMode}
          onEdit={onEdit}
          onDelete={onDelete}
          onUserClick={onUserClick}
        />
      );

    case 'OPPORTUNITY':
      return (
        <OpportunityCard
          post={item}
          isManageMode={isManageMode}
          onEdit={onEdit}
          onDelete={onDelete}
          onUserClick={onUserClick}
        />
      );

    case 'ANNOUNCEMENT':
      return (
        <AnnouncementCard
          post={item}
          isManageMode={isManageMode}
          onEdit={onEdit}
          onDelete={onDelete}
          onUserClick={onUserClick}
        />
      );

    case 'POST':
    case 'STANDARD_POST':
    default:
      return (
        <StandardPostCard
          post={item}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
          onCommentClick={onCommentClick}
          isManageMode={isManageMode}
          onEdit={onEdit}
          onDelete={onDelete}
          onUserClick={onUserClick}
        />
      );
  }
}
