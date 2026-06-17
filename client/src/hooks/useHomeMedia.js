import { useState, useEffect } from 'react';
import { getTrendingMovies } from '../features/movies/api/movieService';
import { gameService } from '../features/games/api/gameService';
import { normalizeMovies, normalizeGames, interleaveMedia } from '../utils/mediaUtils';

export const useHomeMedia = () => {
  const [trendingMedia, setTrendingMedia] = useState([]);
  const [recentlyAddedMedia, setRecentlyAddedMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopMedia = async () => {
      try {
        const [moviesRes, trendingGamesRes, recentMoviesRes, recentGamesRes] = await Promise.all([
          getTrendingMovies(4),
          gameService.getTrending({ take: 4 }),
          getTrendingMovies(6),
          gameService.getRecentlyAdded({ take: 6 }),
        ]);

        const extractData = (res) => Array.isArray(res) ? res : res?.items || res?.data?.data || res?.data || res?.results || [];

        const movies = extractData(moviesRes);
        let games = extractData(trendingGamesRes);

        if (games.length === 0) {


          const fallbackGamesRes = await gameService.getRecentlyAdded({ take: 4 });
          games = extractData(fallbackGamesRes);
        }

        const recentMovies = extractData(recentMoviesRes);
        const recentGames = extractData(recentGamesRes);

        const normalizedMovies = normalizeMovies(movies, 4);
        const normalizedGames = normalizeGames(games, 4);
        setTrendingMedia(interleaveMedia(normalizedMovies, normalizedGames, 8));

        const normalizedRecentMovies = normalizeMovies(recentMovies, 6);
        const normalizedRecentGames = normalizeGames(recentGames, 6);
        setRecentlyAddedMedia(interleaveMedia(normalizedRecentMovies, normalizedRecentGames, 12));

      } catch (error) {
        console.error('Failed to fetch media:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopMedia();
  }, []);

  return { trendingMedia, recentlyAddedMedia, isLoading };
};