import { useInfiniteQuery } from '@tanstack/react-query';
import movieReviewService from '../api/movieReviewService';

export const useMovieReviews = (movieId, pageSize = 10) => {
  return useInfiniteQuery({
    queryKey: ['movieReviews', movieId],
    queryFn: ({ pageParam = 1, signal }) => 
      movieReviewService.getMovieReviews(movieId, pageParam, pageSize, signal),
     
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.pageNumber < lastPage.totalPages) {
        return lastPage.pageNumber + 1;
      }
      return undefined;
    },
    enabled: !!movieId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
