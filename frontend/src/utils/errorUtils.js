/**
 * Error extraction utility for Django REST Framework and Axios errors
 */

export const extractErrorMessage = (err, fallback = 'An unexpected error occurred.') => {
  if (!err) return fallback;

  const data = err.response?.data;
  if (!data) return err.message || fallback;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.includes('<html') || trimmed.includes('<body') || trimmed.includes('<title>')) {
      const status = err.response?.status;
      if (status === 404) return 'Requested service endpoint was not found (404).';
      if (status === 500) return 'Internal server error occurred (500). Please try again shortly.';
      if (status === 403) return 'You do not have permission to perform this action (403).';
      return `Server returned unexpected response (${status || 'Error'}).`;
    }
    return data;
  }
  if (data.error && typeof data.error === 'string') return data.error;
  if (data.detail && typeof data.detail === 'string') return data.detail;
  if (data.message && typeof data.message === 'string') return data.message;

  // DRF serializer validation errors: { field: ["Error message"], ... }
  if (typeof data === 'object') {
    const messages = [];
    for (const [key, value] of Object.entries(data)) {
      const prefix = key === 'non_field_errors' || key === 'error' ? '' : `${key.replace(/_/g, ' ')}: `;
      if (Array.isArray(value)) {
        messages.push(`${prefix}${value.join(' ')}`);
      } else if (typeof value === 'string') {
        messages.push(`${prefix}${value}`);
      } else if (typeof value === 'object' && value !== null) {
        messages.push(`${prefix}${JSON.stringify(value)}`);
      }
    }
    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  return fallback;
};

export const getFieldErrors = (err) => {
  const result = {};
  const data = err?.response?.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) {
        result[key] = val.join(' ');
      } else if (typeof val === 'string') {
        result[key] = val;
      }
    }
  }
  return result;
};

export default { extractErrorMessage, getFieldErrors };
