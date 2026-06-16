import { apiClient } from '../../../lib/apiClient';

/**
 * Fetch reviews for a specific movie.
 * @param {number|string} movieId   - Internal DB ID of the movie
 * @param {number} pageIndex       - 1-based page number
 * @param {number} pageSize        - Items per page (default 20)
 * @param {AbortSignal} [signal]   - Optional cancellation signal
 * @returns {Promise<Object>} PagedResponse<ReviewDto>
 */
export const getMovieReviews = async (movieId, pageIndex = 1, pageSize = 20, signal) => {
  const response = await apiClient.get(`/movie-reviews/${movieId}`, {
    params: { pageIndex, pageSize },
    signal,
  });
  return response.data;
};

/**
 * Add a review for a movie.
 * @param {Object} payload { movieId, body }
 * @returns {Promise<Object>} The created review (or status)
 */
export const addMovieReview = async ({ movieId, body }) => {
  const response = await apiClient.post(`/movie-reviews/${movieId}`, { body });
  return response.data;
};

/**
 * Update an existing review for a movie.
 * @param {Object} payload { movieId, body }
 * @returns {Promise<Object>} The updated review
 */
export const updateMovieReview = async ({ movieId, body }) => {
  const response = await apiClient.put(`/movie-reviews/${movieId}`, { body });
  return response.data;
};

/**
 * Delete a review for a movie.
 * @param {number|string} movieId   - Internal DB ID of the movie
 * @returns {Promise<Object>} { deleted: true }
 */
export const deleteMovieReview = async (movieId) => {
  const response = await apiClient.delete(`/movie-reviews/${movieId}`);
  return response.data;
};

const movieReviewService = {
  getMovieReviews,
  addMovieReview,
  updateMovieReview,
  deleteMovieReview,
};

export default movieReviewService;
