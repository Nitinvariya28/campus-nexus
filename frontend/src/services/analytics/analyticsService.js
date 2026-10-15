import api from '../api';

/**
 * Normalizes filter parameters between frontend UI names and backend ORM parameters.
 * Ensures filters like year, department, batch, and date range map 1:1 to backend queries.
 */
export const normalizeFilters = (filters = {}) => {
  const normalized = { ...filters };

  // Map common filter keys to backend query parameter names
  if (normalized.year && !normalized.placement_year) {
    normalized.placement_year = normalized.year;
  }
  if (normalized.department && !normalized.department_id) {
    normalized.department_id = normalized.department;
  }
  if (normalized.batch && !normalized.batch_id) {
    normalized.batch_id = normalized.batch;
  }

  // Handle date range conversion to date_from ISO strings
  if (normalized.range && !normalized.date_from) {
    const now = new Date();
    if (normalized.range === '30d') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      normalized.date_from = past.toISOString().split('T')[0];
    } else if (normalized.range === '6m') {
      const past = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      normalized.date_from = past.toISOString().split('T')[0];
    } else if (normalized.range === '12m') {
      const past = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      normalized.date_from = past.toISOString().split('T')[0];
    }
  }

  // Strip empty strings, null, undefined, and non-query keys
  Object.keys(normalized).forEach((key) => {
    if (
      normalized[key] === '' ||
      normalized[key] === null ||
      normalized[key] === undefined ||
      normalized[key] === 'all'
    ) {
      delete normalized[key];
    }
  });

  return normalized;
};

/**
 * Universal Analytics Dashboard API Gateway
 * Consumes GET /api/analytics/dashboard/
 *
 * NOTE: Zero authentication or token logic is present in this file.
 * The central Axios client (src/services/api.js) automatically injects the JWT Bearer token.
 *
 * @param {string} view - 'common' | 'student' | 'alumni' | 'placement_cell'
 * @param {object} filters - Dynamic contextual query parameters (year, dept, batch, range, etc.)
 * @param {AbortSignal} [signal] - Optional AbortController signal for request cancellation
 */
export const fetchDashboardData = async (view = 'common', filters = {}, signal = null) => {
  const params = {
    view,
    ...normalizeFilters(filters),
  };

  const response = await api.get('/analytics/dashboard/', {
    params,
    signal,
  });

  return response.data;
};

export default {
  normalizeFilters,
  fetchDashboardData,
};
