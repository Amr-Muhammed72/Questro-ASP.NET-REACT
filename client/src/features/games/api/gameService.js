import { apiClient } from '../../../lib/apiClient';

export const gameService = {
  /**
   * Fetch paginated games with optional filters
   * @param {Object} params - Query parameters (pageIndex, pageSize, search, genreId, etc.)
   * @returns {Promise<Object>} PagedResponse<GameListItemDto>
   */
  getGames: async (params = {}, signal) => {
    const response = await apiClient.get('/Games', { params, signal });
    return response.data;
  },

  /**
   * Fetch game details by RAWG ID
   */
  getGameDetails: async (rawgId, signal) => {
    const response = await apiClient.get(`/Games/${rawgId}`, { signal });
    return response.data;
  },

  /**
   * Fetch all available game genres
   * @returns {Promise<Array>} GameGenreDto[]
   */
  getGenres: async () => {
    const response = await apiClient.get('/Games/genres');
    return response.data;
  },

  /**
   * Fetch all available game platforms
   * @returns {Promise<Array>} GamePlatformDto[]
   */
  getPlatforms: async () => {
    const response = await apiClient.get('/Games/platforms');
    return response.data;
  },

  /**
   * Fetch recently added games
   */
  getRecentlyAdded: async (params = {}) => {
    const response = await apiClient.get('/Games/recently-added', { params });
    
    return response.data;
  },

  /**
   * Fetch trending games
   */
  getTrending: async (params = {}) => {
    const response = await apiClient.get('/Games/trending', { params });
    return response.data;
  },

  /**
   * Fetch personalised recommendations for the authenticated user
   */
  getRecommendedForMe: async (params = {}) => {
    const response = await apiClient.get('/Games/recommended-for-me', { params });
    // Parse games as a paged response: result.data
    return response.data?.data || [];
  },

  /**
   * Discover games with filters and pagination
   * @param {Object} filters - Filter parameters (search, genreId, platformId, year, minRating, maxRating, sort)
   * @param {number} pageIndex
   * @param {number} pageSize
   */
  discoverGames: async (filters = {}, pageIndex = 1, pageSize = 18, signal) => {
    const params = {
      pageIndex,
      pageSize,
    };

    const validFilters = ['search', 'genreId', 'platformId', 'year', 'minRating', 'maxRating', 'sort'];
    validFilters.forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    const response = await apiClient.get('/Games', { params, signal });
    return response.data;
  }
};

export default gameService;