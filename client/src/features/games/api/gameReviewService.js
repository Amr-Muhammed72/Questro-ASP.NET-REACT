import { apiClient } from '../../../lib/apiClient';

/**
 * Fetch reviews for a specific game.
 */
export const getGameReviews = async (gameId, pageIndex = 1, pageSize = 20, signal) => {
  const response = await apiClient.get(`/GameReview/${gameId}/reviews`, {
    params: { pageIndex, pageSize },
    signal,
  });
  return response.data;
};

/**
 * Add a review for a game.
 */
export const addGameReview = async ({ gameId, body }) => {
  const response = await apiClient.post(`/GameReview/${gameId}/add-review`, { 
    content: body
  });
  return response.data;
};

/**
 * Update an existing review for a game.
 */
export const updateGameReview = async ({ gameId, body }) => {
  const response = await apiClient.put(`/GameReview/${gameId}/update-review`, { content: body });
  return response.data;
};

/**
 * Delete a review for a game.
 */
export const deleteGameReview = async (gameId) => {
  const response = await apiClient.delete(`/GameReview/${gameId}/delete-review`);
  return response.data;
};

const gameReviewService = {
  getGameReviews,
  addGameReview,
  updateGameReview,
  deleteGameReview,
};

export default gameReviewService;
