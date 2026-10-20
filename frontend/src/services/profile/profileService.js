import api from '../api';

/**
 * Profile Management API Service
 * Centralized service layer for profile hydration, updates, resumes, and credentials.
 * (Base template structure - endpoints defined and ready for business wiring)
 */
export const profileService = {
  /**
   * Fetch authenticated user's master profile
   * GET /api/profiles/me/
   */
  getProfileMe: async () => {
    const response = await api.get('/profiles/me/');
    return response.data;
  },

  /**
   * Fetch master dropdown and options data
   * GET /api/profiles/options/
   */
  getProfileOptions: async () => {
    const response = await api.get('/profiles/options/');
    return response.data;
  },

  /**
   * Update profile information
   * PATCH /api/profiles/me/
   */
  updateProfile: async (payload) => {
    const response = await api.patch('/profiles/me/', payload);
    return response.data;
  },

  /**
   * Change account password
   * POST /api/auth/password/change/
   */
  changePassword: async ({ current_password, new_password, confirm_password }) => {
    const response = await api.post('/auth/password/change/', {
      current_password,
      new_password,
      confirm_password,
    });
    return response.data;
  },

  /**
   * Upload user profile avatar photo
   * POST /api/profiles/avatar/
   */
  uploadAvatar: async (formData) => {
    const response = await api.post('/profiles/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Upload user profile cover banner image
   * POST /api/profiles/cover/
   */
  uploadCover: async (formData) => {
    const response = await api.post('/profiles/cover/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Delete custom cover image and revert to default
   * DELETE /api/profiles/cover/
   */
  deleteCover: async () => {
    const response = await api.delete('/profiles/cover/');
    return response.data;
  },

  /**
   * Request OTP to update alumni personal email address
   * POST /api/auth/alumni/request-email-otp/
   */
  requestAlumniEmailOTP: async ({ new_email, password }) => {
    const response = await api.post('/auth/alumni/request-email-otp/', {
      new_email,
      password,
    });
    return response.data;
  },

  /**
   * Finalize updating alumni personal email address with OTP
   * PATCH /api/auth/alumni/change-email/
   */
  changeAlumniEmail: async ({ new_email, otp_code }) => {
    const response = await api.patch('/auth/alumni/change-email/', {
      new_email,
      otp_code,
    });
    return response.data;
  },

  /**
   * Soft-delete account via anonymization
   * DELETE /api/profiles/me/
   */
  deleteAccount: async (confirmationText) => {
    const response = await api.delete('/profiles/me/', {
      data: { confirmation: confirmationText },
    });
    return response.data;
  },

  /**
   * Resume Management Endpoints
   */
  listResumes: async () => {
    const response = await api.get('/resumes/');
    return response.data;
  },

  uploadResume: async (formData) => {
    const response = await api.post('/resumes/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  setPrimaryResume: async (resumeId) => {
    const response = await api.patch(`/resumes/${resumeId}/set-primary/`);
    return response.data;
  },

  deleteResume: async (resumeId) => {
    const response = await api.delete(`/resumes/${resumeId}/`);
    return response.data;
  },
};

export default profileService;
