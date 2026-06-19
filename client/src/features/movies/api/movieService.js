import { apiClient } from '../../../lib/apiClient';

/**
 * Fetch all available movie genres.
 * @returns {Promise<Array>} GenreDto[]
 */
export const getGenres = async () => {
  const response = await apiClient.get('/movies/genres');
  return response.data;
};

/**
 * Discover / search movies with optional filters and pagination.
 * Handles both the paginated /movies endpoint and the named-list
 * endpoints (trending, recently-added, recommended, recommended-for-me).
 *
 * @param {Object} filters         - Active filter values
 * @param {number} pageIndex       - 1-based page number
 * @param {number} pageSize        - Items per page (default 18)
 * @param {AbortSignal} [signal]   - Optional cancellation signal
 * @returns {Promise<Object>} PagedResponse<MovieListItemDto> or array
 */
export const discoverMovies = async (filters, pageIndex, pageSize = 18, signal) => {
  const isListEndpoint = !!filters.list;

  // ── Named-list endpoints (trending, recently-added, etc.) ──────────────────
  if (isListEndpoint) {
    const listRouteMap = {
      'recommended':        '/movies/recommended',
      'trending':           '/movies/trending',
      'recently-added':     '/movies/recently-added',
      'recommended-for-me': '/movies/recommended-for-me',
    };

    const endpoint = listRouteMap[filters.list] ?? '/movies';
    // List endpoints use `take` (cumulative), not pagination
    const params = { take: pageSize * pageIndex };
    const response = await apiClient.get(endpoint, { params, signal });
    return response.data;
  }

  // ── Paginated discover endpoint ────────────────────────────────────────────
  const params = { pageIndex, pageSize };
  const validFilters = ['search', 'genreId', 'language', 'year', 'minRating', 'maxRating', 'quality', 'sort'];
  validFilters.forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      params[key] = filters[key];
    }
  });

  const response = await apiClient.get('/movies', { params, signal });
  return response.data;
};

/**
 * Fetch trending movies.
 * @param {number} take            - Number of results to return
 * @param {AbortSignal} [signal]   - Optional cancellation signal
 * @returns {Promise<Object>}
 */
export const getTrendingMovies = async (take = 18, signal) => {
  const response = await apiClient.get('/movies/trending', { params: { take }, signal });
  return response.data;
};

/**
 * Fetch recently added movies.
 * @param {number} take            - Number of results to return
 * @param {AbortSignal} [signal]   - Optional cancellation signal
 * @returns {Promise<Object>}
 */
export const getRecentlyAdded = async (take = 18, signal) => {
  const response = await apiClient.get('/movies/recently-added', { params: { take }, signal });
  return response.data;
};

/**
 * Fetch recommended movies (general / editorial).
 * @param {number} take            - Number of results to return
 * @param {AbortSignal} [signal]   - Optional cancellation signal
 * @returns {Promise<Object>}
 */
export const getRecommended = async (take = 18, signal) => {
  const response = await apiClient.get('/movies/recommended', { params: { take }, signal });
  return response.data;
};

/**
 * Fetch personalised recommendations for the authenticated user.
 * @param {number} take            - Number of results to return
 * @param {AbortSignal} [signal]   - Optional cancellation signal
 * @returns {Promise<Object>}
 */
export const getRecommendedForMe = async (take = 18, signal) => {
  const response = await apiClient.get('/movies/recommended-for-me', { params: { take }, signal });
  return response.data;
};

/**
 * Fetch detailed information for a specific movie.
 * @param {number|string} tmdbId   - TMDB ID of the movie
 * @param {AbortSignal} [signal]   - Optional cancellation signal
 * @returns {Promise<Object>} MovieDetailsDto
 */
export const getMovieDetails = async (tmdbId, signal) => {
  const response = await apiClient.get(`/movies/${tmdbId}`, { signal });
  return response.data;
};

/**
 * Fetch cast and crew for a specific movie.
 * @param {number|string} tmdbId   - TMDB ID of the movie
 * @param {AbortSignal} [signal]   - Optional cancellation signal
 * @returns {Promise<Object>} StaffResponseDto
 */
export const getMovieStaff = async (tmdbId, signal) => {
  const response = await apiClient.get(`/staff/${tmdbId}`, { signal });
  return response.data;
};

const movieService = {
  getGenres,
  discoverMovies,
  getTrendingMovies,
  getRecentlyAdded,
  getRecommended,
  getRecommendedForMe,
  getMovieDetails,
  getMovieStaff,
};

export default movieService;