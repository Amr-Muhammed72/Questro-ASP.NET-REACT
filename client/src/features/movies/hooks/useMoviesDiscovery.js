import { useState, useEffect, useRef, useCallback } from 'react';
import { discoverMovies } from '../api/movieService';
import { useMovieStore } from '../store/useMovieStore'; 

export const useMoviesDiscovery = () => {
  const [movies, setMovies] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const filters = useMovieStore(state => state.filters);
  const setFilters = useMovieStore(state => state.setFilters);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const data = await discoverMovies(
          filters, 
          pageIndex, 
          18, 
          abortControllerRef.current.signal
        );
        
        const newMovies = Array.isArray(data) ? data : (data.data || []);
        
        setMovies(prevMovies => 
          pageIndex === 1 ? newMovies : [...prevMovies, ...newMovies]
        );
        
        const currentTotalPages = data.totalPages || 1;
        setHasMore(pageIndex < currentTotalPages && newMovies.length > 0);

      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching movies:', err);
          setError(err.message);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pageIndex, filters]); 
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPageIndex(prev => prev + 1);
    }
  }, [loading, hasMore]);
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters); 
    setPageIndex(1); 
  }, [setFilters]);

  return { movies, pageIndex, loading, hasMore, error, filters, loadMore, updateFilters };
};

export default useMoviesDiscovery;
