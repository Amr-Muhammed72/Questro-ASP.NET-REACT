import { apiClient } from '../../../lib/apiClient';

export const searchService = {
  /**
   * Performs a global search across movies, games, actors, and users.
   * Authentication is automatically handled by the apiClient interceptor.
   * Child filtering is automatically handled by the backend if a child token is sent.
   * 
   * @param {string} query The search term
   * @param {number} limit Maximum results per category (clamped to 20 by server)
   * @returns {Promise<{ movies: any[], games: any[], actors: any[], users: any[] }>}
   */
  globalSearch: async (query, limit = 5) => {
    if (!query || query.trim() === '') {
      return { movies: [], games: [], actors: [], users: [] };
    }
    const response = await apiClient.get('/Search', {
      params: {
        q: query,
        limit
      }
    });
    return response.data;
  }
};
