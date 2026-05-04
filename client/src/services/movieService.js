const BASE_URL = 'http://localhost:5222';

export const getGenres = async () => {
  const response = await fetch(`${BASE_URL}/api/movies/genres`);
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  return response.json();
};

export const discoverMovies = async (filters, pageIndex, pageSize = 18, signal) => {
  const params = new URLSearchParams();
  const isListEndpoint = !!filters.list;
  console.log('Discovering movies with filters:', filters, 'pageIndex:', pageIndex, 'pageSize:', pageSize, 'isListEndpoint:', isListEndpoint  );
  if (isListEndpoint) {
    console.log('Using list endpoint, applying take parameter', pageSize * pageIndex);
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
  console.log('Constructed query params:', params.toString());
  let endpoint = `${BASE_URL}/api/movies`;
  if (isListEndpoint) {
    if (filters.list === 'recommended') endpoint = `${BASE_URL}/api/movies/recommended`;
    else if (filters.list === 'trending') endpoint = `${BASE_URL}/api/movies/trending`;
    else if (filters.list === 'recently-added') endpoint = `${BASE_URL}/api/movies/recently-added`;
    else if (filters.list === 'recommended-for-me') endpoint = `${BASE_URL}/api/movies/recommended-for-me`;
  }
  console.log(`Lol movies from ${endpoint}?${params.toString()}`);
  console.log('page index:', pageIndex, 'page size:', pageSize);
  const response = await fetch(`${endpoint}?${params.toString()}`, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.en || 'Failed to fetch movies');
  }
  console.log(`Fetched movies for ${endpoint} with filters:`, filters);
  console.log('Response data:', await response.clone().json());
  return response.json(); 
};

export const getRecentlyAdded = async () => {
  const response = await fetch(`${BASE_URL}/api/movies/recently-added?take=18`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.en || 'Failed to fetch recently added movies');
  }
  return response.json();
};

export const getTrendingMovies = async () => {
  const response = await fetch(`${BASE_URL}/api/movies/trending?take=18`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.en || 'Failed to fetch trending movies');
  }
  return response.json();
};

export const getRecommended = async () => {
  const response = await fetch(`${BASE_URL}/api/movies/recommended?take=18`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.en || 'Failed to fetch recommended movies');
  }
  console.log('Recommended movies response:', await response.clone().json());
  return response.json();
};
