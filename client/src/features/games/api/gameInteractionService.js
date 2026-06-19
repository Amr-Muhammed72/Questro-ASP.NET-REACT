import { apiClient } from '../../../lib/apiClient';

/**
 * Toggle the like status of a game.
 */
export const toggleLike = async (gameId) => {
  const response = await apiClient.post(`/game-interactions/${gameId}/like`);
  return response.data;
};

/**
 * Toggle the watchlist status of a game.
 */
export const toggleWatchlist = async (gameId) => {
  const response = await apiClient.post(`/game-interactions/${gameId}/wishlist`);
  return response.data;
};

/**
 * Set a rating for a game.
 */
export const rateGame = async ({ gameId, stars }) => {
  const response = await apiClient.post(`/game-interactions/${gameId}/rate`, { stars });
  return response.data;
};

/**
 * Get interaction status of a game.
 */
export const getInteractionStatus = async (gameId) => {
  // Using earlier requested path, since docs omitted the GET
  const response = await apiClient.get(`/games/${gameId}/interaction-status`);
  return response.data;
};

const gameInteractionService = {
  toggleLike,
  toggleWatchlist,
  rateGame,
  getInteractionStatus,
};

export default gameInteractionService;
