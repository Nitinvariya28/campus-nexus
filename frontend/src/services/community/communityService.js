import api from '../api';

/**
 * Community API Service
 * Centralized HTTP service for AlumiBridge Community Subsystem.
 * Uses the configured api axios client with JWT token injection and 401 refresh.
 */

/**
 * Fetches the unified polymorphic community feed.
 * @param {Object} options
 * @param {number} [options.limit=10] - Number of items to fetch.
 * @param {number} [options.offset=0] - Offset index for pagination.
 * @param {string|string[]} [options.role] - Optional role filter ('STUDENT', 'ALUMNI', 'PLACEMENT_CELL') or array.
 * @param {number|string} [options.author_id] - Optional author filter (e.g. 'me' or user ID).
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export async function fetchUnifiedFeed({ limit = 10, offset = 0, role, author_id } = {}) {
  const params = {
    limit,
    offset,
  };

  if (role) {
    if (Array.isArray(role)) {
      const filtered = role.filter((r) => r && r.toUpperCase() !== 'ALL');
      if (filtered.length > 0) {
        params.role = filtered.join(',');
      }
    } else if (typeof role === 'string' && role.toUpperCase() !== 'ALL') {
      params.role = role.trim();
    }
  }

  if (author_id) {
    params.author_id = author_id;
  }

  const response = await api.get('/community/feed/', { params });
  return response.data;
}

/**
 * Searches across posts, opportunities, interview experiences, and announcements.
 * @param {Object} options
 * @param {string} options.query - The search query term.
 * @param {number} [options.limit=10] - Number of items to fetch.
 * @param {number} [options.offset=0] - Offset index.
 * @param {string|string[]} [options.role] - Optional role filter.
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export async function searchFeed({ query, limit = 10, offset = 0, role } = {}) {
  const params = {
    q: query,
    limit,
    offset,
  };

  if (role) {
    if (Array.isArray(role)) {
      const filtered = role.filter((r) => r && r.toUpperCase() !== 'ALL');
      if (filtered.length > 0) {
        params.role = filtered.join(',');
      }
    } else if (typeof role === 'string' && role.toUpperCase() !== 'ALL') {
      params.role = role.trim();
    }
  }

  const response = await api.get('/community/feed/search/', { params });
  return response.data;
}

/**
 * Fetches bookmarked posts for the current authenticated user.
 * @param {Object} options
 * @param {number} [options.limit=10]
 * @param {number} [options.offset=0]
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export async function fetchSavedPosts({ limit = 10, offset = 0 } = {}) {
  const response = await api.get('/community/bookmarks/', {
    params: { limit, offset },
  });
  return response.data;
}

/**
 * Toggles like on a post, opportunity, announcement, or interview.
 * @param {number} postId
 * @param {string} [entityType='POST']
 * @returns {Promise<{message: string, likes_count: number, is_liked_by_me: boolean}>}
 */
export async function togglePostLike(postId, entityType = 'POST') {
  const response = await api.post(`/community/posts/${postId}/toggle-like/`, null, {
    params: { type: entityType },
  });
  return response.data;
}

/**
 * Toggles bookmark on a post, opportunity, announcement, or interview.
 * @param {number} postId
 * @param {string} [entityType='POST']
 * @returns {Promise<{message: string, is_bookmarked_by_me: boolean}>}
 */
export async function togglePostBookmark(postId, entityType = 'POST') {
  const response = await api.post(`/community/posts/${postId}/toggle-bookmark/`, null, {
    params: { type: entityType },
  });
  return response.data;
}

/**
 * Fetches comments for a post, opportunity, announcement, or interview.
 * @param {number} postId
 * @param {Object} options
 * @param {number} [options.limit=10]
 * @param {number} [options.offset=0]
 * @param {string} [options.type='POST']
 * @returns {Promise<{count: number, next: string|null, previous: string|null, results: Array}>}
 */
export async function fetchPostComments(postId, { limit = 10, offset = 0, type = 'POST' } = {}) {
  const response = await api.get(`/community/posts/${postId}/comments/`, {
    params: { limit, offset, type },
  });
  return response.data;
}

/**
 * Creates a comment on a post, opportunity, announcement, or interview.
 * @param {number} postId
 * @param {string} content
 * @param {Object} [options]
 * @param {string} [options.type='POST']
 * @returns {Promise<{message: string, comment: Object}>}
 */
export async function createPostComment(postId, content, { type = 'POST' } = {}) {
  const response = await api.post(`/community/posts/${postId}/comments/`, { content }, {
    params: { type },
  });
  return response.data;
}

/**
 * Fetches dynamic creation options based on the user's role.
 * @returns {Promise<Object>}
 */
export async function fetchPostCreationOptions() {
  const response = await api.get('/community/posts/options/');
  return response.data;
}

export default {
  fetchUnifiedFeed,
  searchFeed,
  fetchSavedPosts,
  togglePostLike,
  togglePostBookmark,
  fetchPostComments,
  createPostComment,
  fetchPostCreationOptions,
};
