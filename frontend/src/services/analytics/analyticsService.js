import api from '../api';

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
    ...filters,
  };

  // Remove empty/null/undefined filter parameters to keep query strings clean
  Object.keys(params).forEach((key) => {
    if (params[key] === '' || params[key] === null || params[key] === undefined) {
      delete params[key];
    }
  });

  const response = await api.get('/analytics/dashboard/', {
    params,
    signal,
  });

  return response.data;
};

export default {
  fetchDashboardData,
};
