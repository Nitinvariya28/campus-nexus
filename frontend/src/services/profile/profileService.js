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
   * POST /api/accounts/password/change/
   */
  changePassword: async ({ current_password, new_password, confirm_password }) => {
    const response = await api.post('/accounts/password/change/', {
      current_password,
      new_password,
      confirm_password,
    });
    return response.data;
  },

  /**
   * Update alumni personal email address
   * PATCH /api/accounts/alumni/change-email/
   */
  changeAlumniEmail: async ({ new_email, password }) => {
    const response = await api.patch('/accounts/alumni/change-email/', {
      new_email,
      password,
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
