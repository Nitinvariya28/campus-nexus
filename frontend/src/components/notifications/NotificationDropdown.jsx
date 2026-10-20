import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import notificationService from '../../services/notifications/notificationService';
import NotificationItem from './NotificationItem';

export default function NotificationDropdown({ onClose, onUnreadCountChange }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    let isMounted = true;
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const data = await notificationService.listNotifications({ limit: 12 });
        if (isMounted) {
          setNotifications(data.results || []);
          setUnreadCount(data.unread_count || 0);
          if (onUnreadCountChange) {
            onUnreadCountChange(data.unread_count || 0);
          }
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  // Click outside to close popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Mark single notification as read and route
  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        if (onUnreadCountChange) onUnreadCountChange(next);
        return next;
      });

      try {
        await notificationService.markAsRead(notif.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    onClose();

    // Navigate to reference entity
    if (notif.reference_type === 'POST') {
      navigate('/community');
    } else if (notif.reference_type === 'OPPORTUNITY') {
      navigate('/community');
    } else if (notif.reference_type === 'ANNOUNCEMENT') {
      navigate('/community');
    } else {
      navigate('/community');
    }
  };

  // Mark all unread notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* List Container */}
      <div className="max-h-[26rem] overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No notifications yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
              When peers like, comment, or save your posts, you'll see alerts here.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onClick={handleItemClick}
              compact={true}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-2 bg-slate-50/70 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/community');
            }}
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            Go to Community Feed
          </button>
        </div>
      )}
    </div>
  );
}
