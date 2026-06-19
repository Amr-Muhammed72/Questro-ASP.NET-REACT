import { apiClient } from '../../../lib/apiClient';

export const chatbotApi = {
  /**
   * Get an LLM recommendation based on the user's query
   * @param {string} query - The natural language query
   */
  getRecommendation: async (query) => {
    const response = await apiClient.post('/Rag/recommend', { query });
    return response.data;
  }
};
