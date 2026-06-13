import { useCallback, useEffect, useRef, useState } from 'react';
import { gameService } from '../api/gameService';

/**
 * useGamesDiscovery — page-based pagination for the game search/filter view.
 *
 * Public API
 * ──────────
 * games        – current page's items (always replaced, never appended)
 * loading      – true while a fetch is in-flight
 * error        – string | null
 * currentPage  – the active 1-based page number
 * totalPages   – total number of pages from the last successful response
 * totalCount   – total number of matching items
 * updateFilters(obj) – apply new filters, reset to page 1, fire fetch
 * goToPage(n)        – navigate to an arbitrary page, respecting active filters
 */
export const useGamesDiscovery = () => {
  const [games,       setGames]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);

  const paramsRef          = useRef({ filters: {}, pageIndex: 1 });
  const requestIdRef       = useRef(0);
  const abortControllerRef = useRef(null);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchGames = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    const { filters, pageIndex } = paramsRef.current;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const data = await gameService.discoverGames(
        filters,
        pageIndex,
        18,
        abortControllerRef.current.signal,
      );

      if (currentRequestId !== requestIdRef.current) return;

      const items = Array.isArray(data) ? data : (data.data || []);
      setGames(items);
      setCurrentPage(data.pageNumber  ?? pageIndex);
      setTotalPages(data.totalPages   ?? 1);
      setTotalCount(data.totalCount   ?? items.length);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error('Failed to fetch games:', err);
        setError(err.message);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  // ── Public API ─────────────────────────────────────────────────────────────

  const updateFilters = useCallback((newFilters) => {
    paramsRef.current = { filters: newFilters, pageIndex: 1 };
    setGames([]);
    fetchGames();
  }, [fetchGames]);

  const goToPage = useCallback((page) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    if (clamped === paramsRef.current.pageIndex) return;

    paramsRef.current = { ...paramsRef.current, pageIndex: clamped };
    setGames([]);
    fetchGames();
  }, [totalPages, fetchGames]);

  return {
    games,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    updateFilters,
    goToPage,
  };
};

export default useGamesDiscovery;