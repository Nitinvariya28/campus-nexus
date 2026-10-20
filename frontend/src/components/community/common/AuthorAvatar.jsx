import React, { useState } from 'react';
import { getMediaUrl } from '../../../utils/mediaUtils';

/**
 * AuthorAvatar Component
 * Bulletproof avatar container that:
 * 1. Resolves relative media URLs from backend
 * 2. Catches broken image / 404 load errors via onError
 * 3. Falls back gracefully to user's initials gradient badge
 */
export default function AuthorAvatar({
  author,
  size = 'md',
  className = '',
  altText = '',
}) {
  const [imageError, setImageError] = useState(false);

  const rawAvatar = author?.avatar || author?.profile_photo || author?.profile_image;
  const avatarUrl = getMediaUrl(rawAvatar);
  const name = author?.name || author?.full_name || 'User';
  const initial = name ? name.trim().charAt(0).toUpperCase() : 'U';

  const sizeClasses = {
    xs: 'w-6 h-6 text-2xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden select-none ${currentSize} ${className}`}
    >
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={altText || name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-2xs">
          {initial}
        </div>
      )}
    </div>
  );
}
