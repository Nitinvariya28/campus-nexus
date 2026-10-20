import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Briefcase, 
  Megaphone, 
  Bell, 
  CheckCircle2 
} from 'lucide-react';

/**
 * Format relative time cleanly without heavy external libraries.
 */
function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.max(0, Math.floor((now - past) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationItem({ 
  notification, 
  onClick, 
  compact = false 
}) {
  const navigate = useNavigate();
  const { actor, notification_type, title, message, is_read, created_at } = notification;

  // Icon and theme config based on notification_type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'POST_LIKE':
        return {
          icon: Heart,
          iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
          accentColor: 'text-rose-600',
        };
      case 'POST_COMMENT':
        return {
          icon: MessageSquare,
          iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
          accentColor: 'text-blue-600',
        };
      case 'POST_SAVE':
        return {
          icon: Bookmark,
          iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
          accentColor: 'text-purple-600',
        };
      case 'NEW_OPPORTUNITY':
        return {
          icon: Briefcase,
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
          accentColor: 'text-emerald-600',
        };
      case 'NEW_ANNOUNCEMENT':
        return {
          icon: Megaphone,
          iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
          accentColor: 'text-amber-600',
        };
      default:
        return {
          icon: Bell,
          iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
          accentColor: 'text-slate-600',
        };
    }
  };

  const config = getTypeConfig(notification_type);
  const IconComponent = config.icon;

  const actorName = actor?.name || 'Someone';
  const actorInitials = actorName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'U';

  const handleActorClick = (e) => {
    e.stopPropagation();
    if (actor?.id) {
      navigate(`/community?user=${actor.id}`);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-start transition-all cursor-pointer border-b border-slate-100 ${
        is_read 
          ? 'bg-white hover:bg-slate-50/80' 
          : 'bg-blue-50/30 hover:bg-blue-50/60'
      } ${compact ? 'p-3 gap-3' : 'p-4 sm:p-5 gap-3.5'}`}
    >
      {/* Actor Avatar with Type Icon Overlay */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={handleActorClick}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-full transition-transform transform group-hover:scale-105"
          title={`View ${actorName}'s Profile`}
        >
          {actor?.avatar ? (
            <img
              src={actor.avatar}
              alt={actorName}
              className={`rounded-full object-cover ring-1 ring-slate-200 ${
                compact ? 'w-10 h-10' : 'w-11 h-11'
              }`}
            />
          ) : (
            <div
              className={`rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center shadow-xs ring-1 ring-white/80 ${
                compact ? 'w-10 h-10 text-xs' : 'w-11 h-11 text-sm'
              }`}
            >
              {actorInitials}
            </div>
          )}
        </button>

        {/* Floating Mini Type Icon */}
        <div
          className={`absolute -bottom-1 -right-1 p-1 rounded-full border shadow-2xs ${config.iconBg}`}
        >
          <IconComponent className="w-3 h-3" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="leading-snug">
            {/* Clickable Actor Name */}
            {actor && (
              <button
                type="button"
                onClick={handleActorClick}
                className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left inline hover:underline mr-1 text-[13px] sm:text-sm"
              >
                {actorName}
                {actor.is_verified_official && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline ml-1 align-text-bottom" />
                )}
              </button>
            )}

            {/* Notification Title / Action Text */}
            <span className="text-slate-700 font-medium text-[13px] sm:text-sm">
              {actor ? title.replace(actorName, '').trim() : title}
            </span>
          </div>

          {/* Time Ago */}
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap flex-shrink-0">
            {formatTimeAgo(created_at)}
          </span>
        </div>

        {/* Message / Post Excerpt */}
        {message && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {/* Unread Glowing Dot */}
      {!is_read && (
        <div className="flex-shrink-0 self-center">
          <span 
            className="block w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" 
            title="Unread notification"
          />
        </div>
      )}
    </div>
  );
}
