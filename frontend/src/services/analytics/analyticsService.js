import api from '../api';

const DEPARTMENT_MAP = {
  'bce': 22,
  'bec': 23,
  'bme': 24,
  'bee': 25,
  'bcv': 26,
  'cse': 27,
  'it': 28,
  'ece': 29,
  'ee': 30,
  'me': 31,
  'mech': 31,
  'ce': 32,
  'civil': 32,
  'aids': 33,
  'ai&ds': 33,
  'bam': 34,
  'bch': 35,
  'chem': 35,
};

const BATCH_MAP = {
  '2016-2020': 38,
  '2017-2021': 39,
  '2018-2022': 40,
  '2019-2023': 41,
  '2020-2024': 42,
  '2021-2025': 43,
  '2022-2026': 44,
  '2023-2027': 45,
  '2024-2028': 46,
  '2025-2029': 47,
  '2026-2030': 48,
  '2027-2031': 49,
};

/**
 * Normalizes filter parameters between frontend UI names and backend ORM parameters.
 * Ensures filters like year, department, batch, and date range map 1:1 to backend queries.
 */
export const normalizeFilters = (filters = {}) => {
  const normalized = { ...filters };

  // Normalize Department ID (convert string codes or names to database integer IDs)
  const rawDept = normalized.department ?? normalized.department_id;
  if (rawDept && rawDept !== 'all') {
    const strDept = String(rawDept).toLowerCase().trim();
    if (DEPARTMENT_MAP[strDept]) {
      normalized.department_id = DEPARTMENT_MAP[strDept];
    } else if (!isNaN(Number(strDept)) && Number(strDept) > 0) {
      normalized.department_id = Number(strDept);
    } else {
      normalized.department_id = rawDept;
    }
  }
  delete normalized.department;

  // Normalize Batch ID (convert batch ranges to database integer IDs)
  const rawBatch = normalized.batch ?? normalized.batch_id;
  if (rawBatch && rawBatch !== 'all') {
    const strBatch = String(rawBatch).trim();
    if (BATCH_MAP[strBatch]) {
      normalized.batch_id = BATCH_MAP[strBatch];
    } else if (!isNaN(Number(strBatch)) && Number(strBatch) > 0) {
      normalized.batch_id = Number(strBatch);
    } else {
      normalized.batch_id = rawBatch;
    }
  }
  delete normalized.batch;

  // Normalize Year / Placement Year
  const rawYear = normalized.placement_year ?? normalized.year;
  if (rawYear && rawYear !== 'all') {
    const numYear = Number(rawYear);
    if (!isNaN(numYear) && numYear > 0) {
      normalized.placement_year = numYear;
    }
  }
  delete normalized.year;

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
  delete normalized.range;

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

// Client-side cache to eliminate redundant API requests when switching dashboard views
const analyticsCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

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
 * @param {boolean} [forceRefresh=false] - Bypass client-side cache and force fresh request
 */
export const fetchDashboardData = async (view = 'common', filters = {}, signal = null, forceRefresh = false) => {
  const normalized = normalizeFilters(filters);
  const cacheKey = `${view}_${JSON.stringify(normalized)}`;

  if (!forceRefresh && analyticsCache.has(cacheKey)) {
    const entry = analyticsCache.get(cacheKey);
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data;
    }
    analyticsCache.delete(cacheKey);
  }

  const params = {
    view,
    ...normalized,
  };
  if (forceRefresh) {
    params.refresh = 'true';
  }

  const response = await api.get('/analytics/dashboard/', {
    params,
    signal,
  });

  analyticsCache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now(),
  });

  return response.data;
};

export default {
  normalizeFilters,
  fetchDashboardData,
};
