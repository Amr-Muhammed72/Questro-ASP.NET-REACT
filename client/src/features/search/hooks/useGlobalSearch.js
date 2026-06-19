import { useState, useEffect, useRef } from 'react';
import { searchService } from '../api/searchService';

export const useGlobalSearch = (limit = 5) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ movies: [], games: [], actors: [], users: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref to track the latest timeout so we can cancel it
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    // If query is empty, instantly clear results and stop loading
    if (!query || query.trim() === '') {
      setResults({ movies: [], games: [], actors: [], users: [] });
      setIsLoading(false);
      setError(null);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    // Set loading to true immediately when user types
    setIsLoading(true);
    setError(null);

    // Clear the previous timer if the user types again within 300ms
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to fetch after 300ms of inactivity
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchService.globalSearch(query, limit);
        setResults(data || { movies: [], games: [], actors: [], users: [] });
      } catch (err) {
        console.error('Global search error:', err);
        setError(err?.response?.data?.message || 'Failed to perform search');
        setResults({ movies: [], games: [], actors: [], users: [] });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    // Cleanup function runs when effect re-runs (user types) or unmounts
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, limit]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasQuery: query.trim().length > 0
  };
};
