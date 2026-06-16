import { apiClient } from '../../../lib/apiClient';

/**
 * Toggle the like status of a movie.
 * @param {number|string} movieId 
 * @returns {Promise<Object>} MovieInteractionStatusDto
 */
export const toggleLike = async (movieId) => {
  const response = await apiClient.post(`/movie-interactions/${movieId}/like`);
  return response.data;
};

/**
 * Rate a movie.
 * @param {Object} payload { movieId, stars }
 * @returns {Promise<Object>} MovieInteractionStatusDto
 */
export const rateMovie = async ({ movieId, stars }) => {
  const response = await apiClient.post(`/movie-interactions/${movieId}/rate`, { stars });
  return response.data;
};

/**
 * Toggle the watchlist status of a movie.
 * @param {number|string} movieId 
 * @returns {Promise<Object>} MovieInteractionStatusDto
 */
export const toggleWatchlist = async (movieId) => {
  const response = await apiClient.post(`/movie-interactions/${movieId}/watchlist`);
  return response.data;
};

/**
 * Toggle the watched status of a movie.
 * @param {number|string} movieId 
 * @returns {Promise<Object>} MovieInteractionStatusDto
 */
export const toggleWatched = async (movieId) => {
  const response = await apiClient.post(`/movie-interactions/${movieId}/watched`);
  return response.data;
};

const movieInteractionService = {
  toggleLike,
  rateMovie,
  toggleWatchlist,
  toggleWatched,
};

export default movieInteractionService;
