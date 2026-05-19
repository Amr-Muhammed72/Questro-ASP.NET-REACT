const BASE_URL = 'http://localhost:5222';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.en || 'An error occurred');
  }
  return response.json();
};

export const getGenres = async () => {
  const response = await fetch(`${BASE_URL}/api/movies/genres`);
  return handleResponse(response);
};

export const discoverMovies = async (filters, pageIndex, pageSize = 18, signal) => {
  const params = new URLSearchParams();
  const isListEndpoint = !!filters.list;
  
  if (isListEndpoint) {
    params.append('take', (pageSize * pageIndex).toString());
  } else {
    params.append('pageIndex', pageIndex.toString());
    params.append('pageSize', pageSize.toString());
  }
  
  if (!isListEndpoint) {
    const validFilters = ['search', 'genreId', 'language', 'year', 'minRating', 'maxRating', 'quality', 'sort'];
    validFilters.forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key].toString());
      }
    });
  }
  
  let endpoint = `${BASE_URL}/api/movies`;
  if (isListEndpoint) {
    if (filters.list === 'recommended') endpoint = `${BASE_URL}/api/movies/recommended`;
    else if (filters.list === 'trending') endpoint = `${BASE_URL}/api/movies/trending`;
    else if (filters.list === 'recently-added') endpoint = `${BASE_URL}/api/movies/recently-added`;
    else if (filters.list === 'recommended-for-me') endpoint = `${BASE_URL}/api/movies/recommended-for-me`;
  }
  
  const response = await fetch(`${endpoint}?${params.toString()}`, { signal });
  return handleResponse(response);
};

export const getTrendingMovies = async (take = 18) => {
  const response = await fetch(`${BASE_URL}/api/movies/trending?take=${take}`);
  return handleResponse(response);
};

export const getRecentlyAdded = async (take = 18) => {
  const response = await fetch(`${BASE_URL}/api/movies/recently-added?take=${take}`);
  return handleResponse(response);
};

export const getRecommended = async (take = 18) => {
  const response = await fetch(`${BASE_URL}/api/movies/recommended?take=${take}`);
  return handleResponse(response);
};

export const getRecommendedForMe = async (take = 18) => {
  const response = await fetch(`${BASE_URL}/api/movies/recommended-for-me?take=${take}`);
  return handleResponse(response);
};