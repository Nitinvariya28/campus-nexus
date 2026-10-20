import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, ArrowLeft, RefreshCw, Filter } from 'lucide-react';
import notificationService from '../../services/notifications/notificationService';
import NotificationItem from '../../components/notifications/NotificationItem';

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or 'UNREAD'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchNotifications = async (tab = activeTab, currentOffset = 0, append = false) => {
    if (currentOffset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const isReadFilter = tab === 'UNREAD' ? false : null;
      const data = await notificationService.listNotifications({
        limit,
        offset: currentOffset,
        is_read: isReadFilter,
      });

      if (append) {
        setNotifications((prev) => [...prev, ...(data.results || [])]);
      } else {
        setNotifications(data.results || []);
      }
      setUnreadCount(data.unread_count || 0);
      setTotalCount(data.count || 0);
      setOffset(currentOffset + (data.results || []).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab, 0, false);
  }, [activeTab]);

  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      // Optimistic read status update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await notificationService.markAsRead(notif.id);
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }

    // Navigate to referenced post/item
    navigate('/community');
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      if (activeTab === 'UNREAD') {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && notifications.length < totalCount) {
      fetchNotifications(activeTab, offset, true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Top Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-4">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition sm:hidden"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Notifications
                  </h1>
                  <p className="text-xs text-slate-500">
                    Stay updated on post reactions, comments, and placement alerts
                  </p>
                </div>
              </div>
            </div>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200/80 transition disabled:opacity-50"
              >
                {markingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Mark all as read</span>
                <span className="sm:hidden">Mark all</span>
              </button>
            )}
          </div>

          {/* Filter Tabs (LinkedIn-Style: All / Unread) */}
          <div className="flex items-center px-4 pt-1 bg-slate-50/50 border-b border-slate-100 gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`py-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'ALL'
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All</span>
              {totalCount > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                  {totalCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('UNREAD')}
              className={`py-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'UNREAD'
                  ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications List Container */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-11 h-11 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {activeTab === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {activeTab === 'UNREAD'
                  ? 'All notifications have been reviewed. Check the "All" tab for your history.'
                  : 'When someone likes, comments, or saves your posts, or when official placement drives are announced, you will be notified here.'}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                onClick={handleItemClick}
                compact={false}
              />
            ))
          )}
        </div>

        {/* Load More Button */}
        {notifications.length < totalCount && !loading && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition shadow-xs inline-flex items-center gap-2 disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Loading older notifications...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Load more ({totalCount - notifications.length} remaining)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
