import { useState, useEffect, useRef, useCallback } from 'react';
import { getTrendingMovies, getRecentlyAdded, getRecommended, getGenres, discoverMovies } from '../api/movieService';

export const useBrowseData = () => {
  const [trending, setTrending] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [genresWithMovies, setGenresWithMovies] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs — no re-renders on mutation
  const fetchedGenres   = useRef(new Set());
  const allGenresRef    = useRef([]);
  const currentIndexRef = useRef(0);
  const isMountedRef    = useRef(true);
  const isFetchingRef   = useRef(false);
  const sentinelRef     = useRef(null);   // ← DOM node watched by IntersectionObserver

  const CHUNK_SIZE = 3;
  const getGenreId = (genre) => genre.genreId ?? genre.id;

  // ── Fetch movies for a batch of genres ────────────────────────────────────
  const fetchMoviesForGenres = useCallback(async (genresChunk) => {
    const newItems = [];

    await Promise.allSettled(
      genresChunk.map(async (genre) => {
        const genreId = getGenreId(genre);
        if (genreId == null) return;
        if (fetchedGenres.current.has(genreId)) return;
        fetchedGenres.current.add(genreId);

        try {
          const res = await discoverMovies({ genreId }, 1, 10);
          const movies = res?.data ?? (Array.isArray(res) ? res : []);
          if (movies.length > 0) {
            newItems.push({ ...genre, genreId, movies });
          }
        } catch (error) {
          console.error(`Failed to load movies for genre ${genre.name}`, error);
        }
      })
    );

    if (!isMountedRef.current || newItems.length === 0) return;

    setGenresWithMovies(prev => {
      const existing = new Set(prev.map(g => getGenreId(g)));
      const deduped = newItems.filter(item => !existing.has(getGenreId(item)));
      return deduped.length > 0 ? [...prev, ...deduped] : prev;
    });
  }, []);

  // ── Load the next CHUNK_SIZE genres ───────────────────────────────────────
  const loadNextChunk = useCallback(async () => {
    if (isFetchingRef.current) return;

    const allGenres = allGenresRef.current;
    if (currentIndexRef.current >= allGenres.length) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);

    const nextChunk = allGenres.slice(
      currentIndexRef.current,
      currentIndexRef.current + CHUNK_SIZE
    );
    currentIndexRef.current = Math.min(
      currentIndexRef.current + CHUNK_SIZE,
      allGenres.length
    );

    await fetchMoviesForGenres(nextChunk);

    isFetchingRef.current = false;
    setIsLoadingMore(false);
  }, [fetchMoviesForGenres]);

  // ── Main data loader ───────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          getTrendingMovies(10),
          getRecentlyAdded(10),
          getRecommended(10),
          getGenres(),
        ]);

        if (!isMountedRef.current) return;

        const trendingData    = results[0].status === 'fulfilled' ? results[0].value : null;
        const recentlyData    = results[1].status === 'fulfilled' ? results[1].value : null;
        const recommendedData = results[2].status === 'fulfilled' ? results[2].value : null;
        const genresRes       = results[3].status === 'fulfilled' ? results[3].value : null;

        if (trendingData?.data)         setTrending(trendingData.data);
        else if (Array.isArray(trendingData)) setTrending(trendingData);

        if (recentlyData?.data)         setRecentlyAdded(recentlyData.data);
        else if (Array.isArray(recentlyData)) setRecentlyAdded(recentlyData);

        if (recommendedData?.data)      setRecommended(recommendedData.data);
        else if (Array.isArray(recommendedData)) setRecommended(recommendedData);

        let genresList = genresRes?.data || genresRes || [];
        genresList.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const isALast = aName === 'romantic' || aName === 'romance' || aName === 'documentary';
          const isBLast = bName === 'romantic' || bName === 'romance' || bName === 'documentary';
          if (isALast && !isBLast) return 1;
          if (!isALast && isBLast) return -1;
          return a.name.localeCompare(b.name);
        });
        allGenresRef.current = genresList;

        // Load the first chunk immediately (fire-and-forget — no await blocking render)
        const INITIAL_CHUNK_SIZE = 4;
        currentIndexRef.current = Math.min(INITIAL_CHUNK_SIZE, allGenresRef.current.length);
        const initialChunk = allGenresRef.current.slice(0, currentIndexRef.current);
        fetchMoviesForGenres(initialChunk);

      } catch (err) {
        console.error('Failed to load browse data', err);
      }
    };

    loadData();

    // ── IntersectionObserver for lazy genre rows (replaces scroll listener) ─
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadNextChunk();
        }
      },
      { rootMargin: '800px 0px' } // start loading 800 px before sentinel enters viewport
    );

    // Observe sentinel if it is already in the DOM; otherwise a MutationObserver
    // will pick it up once BrowseViewWrapper renders the sentinel node.
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      isMountedRef.current = false;
      observer.disconnect();
    };
  }, [fetchMoviesForGenres, loadNextChunk]);

  return {
    trending,
    recentlyAdded,
    recommended,
    genresWithMovies,
    isLoadingMore,
    sentinelRef,  // ← expose so BrowseViewWrapper can attach the sentinel <div>
  };
};
