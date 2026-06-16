import { useQuery } from '@tanstack/react-query';
import movieService from '../api/movieService';

export const useMovieDetails = (tmdbId) => {
  return useQuery({
    queryKey: ['movie', tmdbId],
    queryFn: ({ signal }) => movieService.getMovieDetails(tmdbId, signal),
    enabled: !!tmdbId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
