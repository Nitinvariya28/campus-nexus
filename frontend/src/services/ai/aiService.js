import api from '../api';

/**
 * AI Service Module
 * Connects frontend to the AlumiBridge AI Backend endpoints:
 * - AI Health: GET /api/ai/health/
 * - Profile Recommendations: GET /api/ai/recommendations/profiles/
 * - Primary Resume Info: GET /api/ai/resume/primary/
 * - Resume ATS Analyzer: POST /api/ai/resume/analyze/
 * - RAG Chatbot: POST /api/ai/chat/
 */

export const aiService = {
  /**
   * Check AI services health (Qdrant & Gemini)
   */
  async getHealth() {
    const response = await api.get('/ai/health/');
    return response.data;
  },

  /**
   * Get personalized profile recommendations for students and alumni.
   * @param {Object} params
   * @param {'ALL'|'STUDENT'|'ALUMNI'} [params.target_role='ALL']
   * @param {number} [params.student_page=1]
   * @param {number} [params.alumni_page=1]
   * @param {number} [params.page_size=5]
   */
  async getProfileRecommendations(params = {}) {
    const {
      target_role = 'ALL',
      student_page = 1,
      alumni_page = 1,
      page_size = 5,
    } = params;

    const response = await api.get('/ai/recommendations/profiles/', {
      params: {
        target_role,
        student_page,
        alumni_page,
        page_size,
      },
    });
    return response.data;
  },

  /**
   * Fetch primary profile resume information (if already uploaded).
   */
  async getPrimaryResume() {
    const response = await api.get('/ai/resume/primary/');
    return response.data;
  },

  /**
   * Analyze a resume against a target job description.
   * Supports FormData (new file upload) or JSON (using primary resume).
   * @param {FormData|Object} payload
   */
  async analyzeResume(payload) {
    if (payload instanceof FormData) {
      const response = await api.post('/ai/resume/analyze/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    const response = await api.post('/ai/resume/analyze/', payload);
    return response.data;
  },

  /**
   * Send a query to the university RAG chatbot.
   * @param {Object} data
   * @param {string} data.message - User prompt
   * @param {'ALL'|'PLACEMENT_CELL'|'NSU'|'INTERVIEW_PREP'|'INDUSTRY_TECH'} [data.category='ALL']
   * @param {Array<{role: 'user'|'assistant', content: string}>} [data.conversation_history=[]]
   */
  async sendChatMessage(data) {
    const promptText = (data.question || data.message || '').trim();
    const history = (data.conversation_history || []).map((m) => ({
      role: m.role || 'user',
      content: (m.content || m.answer || '').slice(0, 1000),
    }));
    const response = await api.post('/ai/chat/', {
      question: promptText,
      message: promptText,
      category: data.category || 'ALL',
      conversation_history: history,
    });
    return response.data;
  },
};

export default aiService;
