import { useState, useEffect } from 'react';
import movieService from '../../movies/api/movieService';
import gameService from '../../games/api/gameService';

export const useSurveyGenres = () => {
  const [movieGenres, setMovieGenres] = useState([]);
  const [gameGenres, setGameGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchGenres = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [moviesRes, gamesRes] = await Promise.all([
          movieService.getGenres(),
          gameService.getGenres()
        ]);

        if (isMounted) {
          setMovieGenres(moviesRes.map(g => g.name || g));
          setGameGenres(gamesRes.map(g => g.name || g));
        }
      } catch (err) {
        console.error("Failed to fetch genres", err);
        if (isMounted) {
          setError('Failed to load genres. Please refresh to try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchGenres();

    return () => {
      isMounted = false;
    };
  }, []);

  return { movieGenres, gameGenres, isLoading, error };
};
