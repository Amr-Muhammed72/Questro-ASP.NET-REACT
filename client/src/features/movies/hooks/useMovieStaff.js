import { useQuery } from '@tanstack/react-query';
import movieService from '../api/movieService';

export const useMovieStaff = (tmdbId) => {
  return useQuery({
    queryKey: ['movieStaff', tmdbId],
    queryFn: ({ signal }) => movieService.getMovieStaff(tmdbId, signal),
    enabled: !!tmdbId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours, staff rarely changes
  });
};
