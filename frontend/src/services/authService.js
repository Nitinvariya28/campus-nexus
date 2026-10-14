import api from './api';

/**
 * Authentication Service for AlumiBridge
 * Connects frontend auth workflows directly to Django REST Framework endpoints.
 */
export const authService = {
  /**
   * Log in user with credentials (email & password)
   * Endpoint: POST /api/auth/login/
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { access_token, refresh_token, user: { id, email, first_name, last_name, role } }
   */
  async login({ email, password }) {
    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };
    const response = await api.post('/auth/login/', payload);
    return response.data;
  },

  /**
   * Register a new current student
   * Endpoint: POST /api/auth/student/register/
   * @param {Object} studentData - { first_name, last_name, email, password }
   * @returns {Promise<Object>} { message: "OTP sent to your university email. Please verify to continue." }
   */
  async registerStudent({ first_name, last_name, email, password }) {
    const payload = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    const response = await api.post('/auth/student/register/', payload);
    return response.data;
  },

  /**
   * Register a graduate alumni
   * Endpoint: POST /api/auth/alumni/register/
   * @param {Object} alumniData - { first_name, last_name, old_university_email, date_of_birth, personal_email, password }
   * @returns {Promise<Object>} { message: "OTP sent to your personal email..." }
   */
  async registerAlumni({ first_name, last_name, old_university_email, date_of_birth, personal_email, password }) {
    const payload = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      old_university_email: old_university_email.trim().toLowerCase(),
      date_of_birth,
      personal_email: personal_email.trim().toLowerCase(),
      password,
    };
    const response = await api.post('/auth/alumni/register/', payload);
    return response.data;
  },

  /**
   * Universal Registration OTP Verification
   * Endpoint: POST /api/auth/verify-otp/
   * @param {Object} data - { email, otp_code }
   * @returns {Promise<Object>} { message: "Email verified successfully! You can now log in." }
   */
  async verifyRegistrationOtp({ email, otp_code }) {
    const payload = {
      email: email.trim().toLowerCase(),
      otp_code: String(otp_code).trim(),
    };
    const response = await api.post('/auth/verify-otp/', payload);
    return response.data;
  },

  /**
   * Password Reset Step 1: Request OTP to registered email
   * Endpoint: POST /api/auth/password-reset/request/
   * @param {string} email
   * @returns {Promise<Object>} { message: "Password reset OTP sent to your email." }
   */
  async requestPasswordReset(email) {
    const payload = {
      email: email.trim().toLowerCase(),
    };
    const response = await api.post('/auth/password-reset/request/', payload);
    return response.data;
  },

  /**
   * Password Reset Step 2: Verify OTP and receive single-use reset_token
   * Endpoint: POST /api/auth/password-reset/verify-otp/
   * @param {Object} data - { email, otp_code }
   * @returns {Promise<Object>} { message: "...", reset_token: "..." }
   */
  async verifyPasswordResetOtp({ email, otp_code }) {
    const payload = {
      email: email.trim().toLowerCase(),
      otp_code: String(otp_code).trim(),
    };
    const response = await api.post('/auth/password-reset/verify-otp/', payload);
    return response.data;
  },

  /**
   * Password Reset Step 3: Confirm new password using cryptographically signed reset_token
   * Endpoint: POST /api/auth/password-reset/confirm/
   * @param {Object} data - { reset_token, new_password, confirm_password }
   * @returns {Promise<Object>} { message: "Password has been reset successfully..." }
   */
  async confirmPasswordReset({ reset_token, new_password, confirm_password }) {
    const payload = {
      reset_token,
      new_password,
      confirm_password,
    };
    const response = await api.post('/auth/password-reset/confirm/', payload);
    return response.data;
  },

  /**
   * Refresh JWT access token using refresh token
   * Endpoint: POST /api/auth/refresh/
   * @param {string} refreshToken
   * @returns {Promise<Object>} { access }
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  },

  /**
   * Universal Logout - invalidates refresh token on backend blacklist
   * Endpoint: POST /api/auth/logout/
   * @param {string} refreshToken
   */
  async logout(refreshToken) {
    if (refreshToken) {
      try {
        await api.post('/auth/logout/', { 
          refresh: refreshToken,
          refresh_token: refreshToken 
        });
      } catch (err) {
        console.warn('Backend logout notification failed, clearing local session anyway.', err);
      }
    }
  },

  /**
   * Helper utility to safely extract clean error messages from DRF response structures
   * @param {any} error
   * @returns {string} Human-friendly error message
   */
  parseApiError(error) {
    if (!error.response) {
      return 'Unable to reach the server. Please check your network connection or ensure the backend server is running.';
    }

    const data = error.response.data;

    // 1. Direct string error
    if (typeof data === 'string') {
      return data;
    }

    // 2. Specific 'error' or 'detail' key
    if (data?.error) {
      return Array.isArray(data.error) ? data.error[0] : String(data.error);
    }
    if (data?.detail) {
      return Array.isArray(data.detail) ? data.detail[0] : String(data.detail);
    }

    // 3. Field validation errors (e.g. { email: ["Enter a valid email."], password: [...] })
    if (typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        const msg = Array.isArray(val) ? val[0] : String(val);
        return `${firstKey.charAt(0).toUpperCase() + firstKey.slice(1).replace('_', ' ')}: ${msg}`;
      }
    }

    return 'An unexpected error occurred during login. Please try again.';
  },
};

export default authService;
