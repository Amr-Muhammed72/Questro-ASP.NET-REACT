import {apiClient, getToken} from '../../../lib/apiClient';
const getUserProfile = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/profile`);
  return response.data;
};

const getMyProfile = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.nameid;
  if (!userId) {
    throw new Error('User ID not found in token');
  }
  return await getUserProfile(userId);
}

const updateProfile = async (profileData) => {
  const response = await apiClient.put('/users/profile', profileData);
  return response.data;
};

const uploadProfilePicture  = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/users/profile/picture', formData, {
    headers: {
      'Content-Type': undefined
    }
  });
  return response.data;
};

const followUser = async (userId) => {
  const response = await apiClient.post(`/users/${userId}/follow`);
  return response.data;
};

const unfollowUser = async (userId) => {
  const response = await apiClient.delete(`/users/${userId}/follow`);
  return response.data;
};

const getFollowStats = async (userId) => {
  const response = await apiClient.get(`/users/${userId}/follow-stats`);
  return response.data;
};

const getMovieWatchlist = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/movies/watchlist?${params}`);
  return response.data;
};

const getMovieLiked = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/movies/liked?${params}`);
  return response.data;
};

const getMovieRated = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/movies/rated?${params}`);
  return response.data;
};
const getMovieWatched = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/movies/watched?${params}`);
  return response.data;
};

const getGameWishlist = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/games/wishlist?${params}`);
  return response.data;
};

const getGameLiked = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/games/liked?${params}`);
  return response.data;
};


const getGameRated = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/games/rated?${params}`);
  return response.data;
};

const getFollowers = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/followers?${params}`);
  return response.data;
};

const getFollowing = async (userId, pageIndex = 1, pageSize = 20) => {
  const params = new URLSearchParams({
    pageIndex: pageIndex.toString(),
    pageSize: pageSize.toString()
  });
  const response = await apiClient.get(`/users/${userId}/following?${params}`);
  return response.data;
};

const removeMovieFromWatchlist = async (movieId) => {
  const response = await apiClient.post(`/movie-interactions/${movieId}/watchlist`);
  return response.data;
};

const removeMovieFromLiked = async (movieId) => {
  const response = await apiClient.post(`/movie-interactions/${movieId}/like`);
  return response.data;
};

const removeMovieFromRated = async (movieId) => {
  const response = await apiClient.post(`/movie-interactions/${movieId}/rate`, { stars: 0 });
  return response.data;
};

const removeMovieFromWatched = async (movieId) => {
  const response = await apiClient.post(`/movie-interactions/${movieId}/watched`);
  return response.data;
};
const removeGameFromWishlist = async (gameId) => {
  const response = await apiClient.post(`/game-interactions/${gameId}/wishlist`);
  return response.data;
};

const removeGameFromLiked = async (gameId) => {
  const response = await apiClient.post(`/game-interactions/${gameId}/like`);
  return response.data;
};

const removeGameFromRated = async (gameId) => {
  const response = await apiClient.post(`/game-interactions/${gameId}/rate`, { stars: 0 });
  return response.data;
};

export  {
  getUserProfile,
  getMyProfile,
  updateProfile,
  uploadProfilePicture,
  followUser,
  unfollowUser,
  getFollowStats,
  getFollowers,
  getFollowing,
  getMovieWatchlist,
  getMovieLiked,
  getMovieRated,
  getMovieWatched,
  getGameWishlist,
  getGameLiked,
  getGameRated,
  removeMovieFromWatchlist,
  removeMovieFromLiked,
  removeMovieFromRated,
  removeMovieFromWatched,
  removeGameFromWishlist,
  removeGameFromLiked,
  removeGameFromRated
};
