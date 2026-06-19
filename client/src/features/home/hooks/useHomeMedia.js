import { useState, useEffect, useRef } from 'react';
import { getTrendingMovies, getRecommendedForMe as getRecommendedMovies } from '../../../features/movies/api/movieService';
import { gameService } from '../../../features/games/api/gameService';
import { normalizeMovies, normalizeGames, interleaveMedia } from '../../../utils/mediaUtils';

export const useHomeMedia = (isLoggedIn = false) => {
  const [trendingMedia, setTrendingMedia] = useState([]);
  const [recentlyAddedMedia, setRecentlyAddedMedia] = useState([]);
  const [recommendedMedia, setRecommendedMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(isLoggedIn);
  const fetchedPublicData = useRef(false);

  const extractData = (res) => Array.isArray(res) ? res : res?.items || res?.data?.data || res?.data || res?.results || [];

  // Fetch public data (trending, recent) once
  useEffect(() => {
    if (fetchedPublicData.current) return;
    
    const fetchPublicMedia = async () => {
      try {
        const [moviesRes, trendingGamesRes, recentMoviesRes, recentGamesRes] = await Promise.all([
          getTrendingMovies(6),
          gameService.getTrending({ take: 6 }),
          getTrendingMovies(6), // using trending as a fallback for recently added if recently added fails
          gameService.getRecentlyAdded({ take: 6 }),
        ]);

        const movies = extractData(moviesRes);
        let games = extractData(trendingGamesRes);

        if (games.length === 0) {
          const fallbackGamesRes = await gameService.getRecentlyAdded({ take: 6 });
          games = extractData(fallbackGamesRes);
        }

        const recentMovies = extractData(recentMoviesRes);
        const recentGames = extractData(recentGamesRes);

        const normalizedMovies = normalizeMovies(movies, 6);
        const normalizedGames = normalizeGames(games, 6);
        setTrendingMedia(interleaveMedia(normalizedMovies, normalizedGames, 12));

        const normalizedRecentMovies = normalizeMovies(recentMovies, 6);
        const normalizedRecentGames = normalizeGames(recentGames, 6);
        setRecentlyAddedMedia(interleaveMedia(normalizedRecentMovies, normalizedRecentGames, 12));

      } catch (error) {
        console.error('Failed to fetch public media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchedPublicData.current = true;
    fetchPublicMedia();
  }, []);

  // Fetch recommendations only when logged in changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isLoggedIn) {
        setRecommendedMedia([]);
        setIsRecommendationsLoading(false);
        return;
      }
      setIsRecommendationsLoading(true);
      try {
        const [recMoviesRes, recGamesRes] = await Promise.allSettled([
          getRecommendedMovies(12),
          gameService.getRecommendedForMe({ take: 12 })
        ]);

        const recMovies = recMoviesRes.status === 'fulfilled' ? extractData(recMoviesRes.value) : [];
        const recGames = recGamesRes.status === 'fulfilled' ? extractData(recGamesRes.value) : [];
        
        const normalizedRecMovies = normalizeMovies(recMovies, 12);
        const normalizedRecGames = normalizeGames(recGames, 12);
        
        setRecommendedMedia(interleaveMedia(normalizedRecMovies, normalizedRecGames, 24));
      } catch (e) {
        console.warn('Failed to fetch recommendations', e);
        setRecommendedMedia([]);
      } finally {
        setIsRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [isLoggedIn]);

  return { trendingMedia, recentlyAddedMedia, recommendedMedia, isLoading, isRecommendationsLoading };
};