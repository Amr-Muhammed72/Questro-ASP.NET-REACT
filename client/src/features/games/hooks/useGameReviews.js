import { useInfiniteQuery } from '@tanstack/react-query';
import gameReviewService from '../api/gameReviewService';

export const useGameReviews = (gameId, pageSize = 10) => {
  return useInfiniteQuery({
    queryKey: ['gameReviews', gameId],
    queryFn: ({ pageParam = 1, signal }) => 
      gameReviewService.getGameReviews(gameId, pageParam, pageSize, signal),
    getNextPageParam: (lastPage, allPages) => { // eslint-disable-line no-unused-vars
      // API response pagination logic might differ, assuming typical
      if (lastPage && lastPage.pageNumber < lastPage.totalPages) {
        return lastPage.pageNumber + 1;
      }
      return undefined;
    },
    enabled: !!gameId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
