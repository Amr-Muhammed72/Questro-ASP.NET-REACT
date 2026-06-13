import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { gameService } from '../api/gameService';

export const useGamesDiscovery = () => {
  const [games, setGames] = useState([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const filters = useGameStore(state => state.filters);
  const setFilters = useGameStore(state => state.setFilters);

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
        const data = await gameService.discoverGames(
          filters,
          pageIndex,
          18,
          abortControllerRef.current.signal
        );
        const newGames = Array.isArray(data) ? data : (data.data || []);
        
        setGames(prevGames => 
          pageIndex === 1 ? newGames : [...prevGames, ...newGames]
        );
        const currentTotalPages = data.totalPages || 1;
        setHasMore(pageIndex < currentTotalPages && newGames.length > 0);
      } catch (error) {
        if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
          console.error('Failed to fetch games:', error);
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
  }, [filters, pageIndex]);
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPageIndex(prev => prev + 1);
    } 
  }, [loading, hasMore]);
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPageIndex(1);
  }, [setFilters]);
  return { games, pageIndex, loading, hasMore, error, updateFilters, loadMore };
};
export default useGamesDiscovery;