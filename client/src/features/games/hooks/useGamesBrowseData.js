import { useState, useEffect, useRef, useCallback } from 'react';
import { gameService } from '../api/gameService';

export default function useGamesBrowseData() {
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [trending, setTrending] = useState([]);
  const [genresWithGames, setGenresWithGames] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fetchedGenres = useRef(new Set());
  const allGenresRef = useRef([]);
  const currentIndexRef = useRef(0);
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const sentinelRef = useRef(null);
  const CHUNK_SIZE = 3;

  const getGenreId = (genre) => genre.genreId ?? genre.id;

  const fetchGamesForGenres = useCallback(async (genresChunk) => {
    const newItems = [];

    await Promise.allSettled(
      genresChunk.map(async (genre) => {
        const genreId = getGenreId(genre);
        if (genreId == null) return;
        if (fetchedGenres.current.has(genreId)) return;
        fetchedGenres.current.add(genreId);
        try {
          const res = await gameService.getGames({ genreId, pageSize: 18, pageIndex: 1 });
          const games = res?.data ?? (Array.isArray(res) ? res : []);
          if (games.length > 0) {
            newItems.push({ ...genre, genreId, games });
          }
        } catch (err) {
          console.error(`Failed to load games for genre ${genre.name}`, err);
        }
      })
    );

    if (!isMountedRef.current || newItems.length === 0) return;

    setGenresWithGames(prev => {
      const existing = new Set(prev.map(g => getGenreId(g)));
      const deduped = newItems.filter(item => !existing.has(getGenreId(item)));
      return deduped.length > 0 ? [...prev, ...deduped] : prev;
    });
  }, []);

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
    await fetchGamesForGenres(nextChunk);
    isFetchingRef.current = false;
    setIsLoadingMore(false);
  }, [fetchGamesForGenres]);

  useEffect(() => {
    isMountedRef.current = true;

    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          gameService.getTrending({ take: 18 }),
          gameService.getRecentlyAdded({ take: 18 }),
          gameService.getGenres()
        ]);

        if (!isMountedRef.current) return;

        const trendingData = results[0].status === 'fulfilled' ? results[0].value : null;
        const recentlyData = results[1].status === 'fulfilled' ? results[1].value : null;
        const genresRes = results[2].status === 'fulfilled' ? results[2].value : null;        

        if (trendingData?.data) setTrending(trendingData.data);
        else if (Array.isArray(trendingData)) setTrending(trendingData);

        if (recentlyData?.data) setRecentlyAdded(recentlyData.data);
        else if (Array.isArray(recentlyData)) setRecentlyAdded(recentlyData);

        let genresList = genresRes?.data || genresRes || [];
        genresList.sort((a, b) => a.name.localeCompare(b.name));
        allGenresRef.current = genresList;
        currentIndexRef.current = Math.min(4, allGenresRef.current.length);
        const initialChunk = allGenresRef.current.slice(0, currentIndexRef.current);
        await fetchGamesForGenres(initialChunk);
      } catch (err) {
        console.error("Failed to fetch games browse data", err);
      }
    };

    loadData();

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadNextChunk();
        }
      },
      { rootMargin: '800px 0px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      isMountedRef.current = false;
      observer.disconnect();
    };
  }, [fetchGamesForGenres, loadNextChunk]);

  return { recentlyAdded, trending, genresWithGames, sentinelRef, isLoadingMore };
}