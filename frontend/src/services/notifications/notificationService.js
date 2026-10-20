import api from '../api';

export const notificationService = {
  /**
   * Fetch paginated notifications with optional read status and type filters.
   * @param {Object} options
   * @param {number} options.limit - Page size (default: 10)
   * @param {number} options.offset - Pagination offset (default: 0)
   * @param {boolean|null} options.is_read - Optional boolean to filter read/unread
   * @param {string|null} options.notification_type - Optional type string
   * @returns {Promise<{ count: number, unread_count: number, next: string|null, previous: string|null, results: Array }>}
   */
  listNotifications: async ({ limit = 10, offset = 0, is_read = null, notification_type = null } = {}) => {
    const params = { limit, offset };
    if (is_read !== null && is_read !== undefined) {
      params.is_read = is_read;
    }
    if (notification_type) {
      params.notification_type = notification_type;
    }
    const response = await api.get('/notifications/', { params });
    return response.data;
  },

  /**
   * Mark a single notification as read by ID.
   * @param {number|string} notificationId
   * @returns {Promise<{ message: string, notification: Object }>}
   */
  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read/`);
    return response.data;
  },

  /**
   * Mark all unread notifications as read for current authenticated user.
   * @returns {Promise<{ message: string, updated_count: number }>}
   */
  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all/');
    return response.data;
  },
};

export default notificationService;
