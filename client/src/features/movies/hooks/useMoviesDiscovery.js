import { useCallback, useEffect, useRef, useState } from 'react';
import { discoverMovies } from '../api/movieService';

/**
 * useMoviesDiscovery — page-based pagination for the movie search/filter view.
 *
 * Public API
 * ──────────
 * movies       – current page's items (always replaced, never appended)
 * loading      – true while a fetch is in-flight
 * error        – string | null
 * currentPage  – the active 1-based page number
 * totalPages   – total number of pages from the last successful response
 * totalCount   – total number of matching items
 * updateFilters(obj) – apply new filters, reset to page 1, fire fetch
 * goToPage(n)        – navigate to an arbitrary page, respecting active filters
 */
export const useMoviesDiscovery = () => {
  const [movies,      setMovies]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);

  // Atomic ref: filters + page always change together — zero chance of
  // a stale-closure reading the wrong page after a filter reset.
  const paramsRef          = useRef({ filters: {}, pageIndex: 1 });
  const requestIdRef       = useRef(0);
  const abortControllerRef = useRef(null);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchMovies = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    const { filters, pageIndex } = paramsRef.current;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const data = await discoverMovies(
        filters,
        pageIndex,
        18,
        abortControllerRef.current.signal,
      );

      if (currentRequestId !== requestIdRef.current) return;

      // Always replace — this is page-based navigation, not infinite scroll.
      const items = Array.isArray(data) ? data : (data.data || []);

      if (items.length === 0 && pageIndex > 1) {
        paramsRef.current = { ...paramsRef.current, pageIndex: 1 };
        fetchMovies();
        return;
      }

      setMovies(items);
      setCurrentPage(data.pageNumber  ?? pageIndex);
      setTotalPages(data.totalPages   ?? 1);
      setTotalCount(data.totalCount   ?? items.length);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error('Error fetching movies:', err);
        setError(err.message);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []); // stable — no deps, reads everything from refs

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Apply a new filter set.  Always resets to page 1 and fires a fetch.
   * Duplicate suppression is handled internally by fetchMovies (requestId + abort).
   */
  const updateFilters = useCallback((newFilters) => {
    paramsRef.current = { filters: newFilters, pageIndex: 1 };
    setMovies([]);      // clear immediately — prevents stale-page flash
    fetchMovies();
  }, [fetchMovies]);

  /**
   * Navigate to a specific page number.
   * Clamps to [1, totalPages].  No-ops on the current page.
   */
  const goToPage = useCallback((page) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    if (clamped === paramsRef.current.pageIndex) return;

    paramsRef.current = { ...paramsRef.current, pageIndex: clamped };
    setMovies([]);
    fetchMovies();
  }, [totalPages, fetchMovies]);

  return {
    movies,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    updateFilters,
    goToPage,
  };
};

export default useMoviesDiscovery;
