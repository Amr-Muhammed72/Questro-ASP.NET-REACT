import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import movieInteractionService from '../api/movieInteractionService';
import movieReviewService from '../api/movieReviewService';

// Helper to create an optimistic mutation for a toggle action
const createOptimisticToggle = (queryClient, movieId, actionType) => {
  return {
    onMutate: async () => {
      const stringId = String(movieId);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['movie', stringId] });

      // Snapshot the previous value
      const previousMovie = queryClient.getQueryData(['movie', stringId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['movie', stringId], (old) => {
        if (!old) return old;

        const oldStatus = old.userStatus || {};
        let newStatus = { ...oldStatus };

        if (actionType === 'like') {
          newStatus.isLiked = !oldStatus.isLiked;
          // Optimistically update the count
          old.likesCount = oldStatus.isLiked ? Math.max(0, (old.likesCount || 0) - 1) : (old.likesCount || 0) + 1;
        } else if (actionType === 'watchlist') {
          newStatus.isInWatchlist = !oldStatus.isInWatchlist;
        } else if (actionType === 'watched') {
          newStatus.isWatched = !oldStatus.isWatched;
        }

        return {
          ...old,
          userStatus: newStatus,
        };
      });

      return { previousMovie };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      const stringId = String(movieId);
      if (context?.previousMovie) {
        queryClient.setQueryData(['movie', stringId], context.previousMovie);
      }
      toast.error(err?.en || 'Failed to update interaction. Please try again.');
    },
    // Always refetch after error or success:
    onSettled: () => {
      const stringId = String(movieId);
      queryClient.invalidateQueries({ queryKey: ['movie', stringId] });
    },
  };
};

export const useToggleLike = (movieId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => movieInteractionService.toggleLike(movieId),
    ...createOptimisticToggle(queryClient, movieId, 'like'),
  });
};

export const useToggleWatchlist = (movieId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => movieInteractionService.toggleWatchlist(movieId),
    ...createOptimisticToggle(queryClient, movieId, 'watchlist'),
  });
};

export const useToggleWatched = (movieId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => movieInteractionService.toggleWatched(movieId),
    ...createOptimisticToggle(queryClient, movieId, 'watched'),
  });
};

export const useRateMovie = (movieId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stars) => movieInteractionService.rateMovie({ movieId, stars }),
    onMutate: async (stars) => {
      const stringId = String(movieId);
      await queryClient.cancelQueries({ queryKey: ['movie', stringId] });
      const previousMovie = queryClient.getQueryData(['movie', stringId]);

      queryClient.setQueryData(['movie', stringId], (old) => {
        if (!old) return old;
        return {
          ...old,
          userStatus: {
            ...(old.userStatus || {}),
            rating: stars,
          },
        };
      });

      return { previousMovie };
    },
    onError: (err, variables, context) => {
      const stringId = String(movieId);
      if (context?.previousMovie) {
        queryClient.setQueryData(['movie', stringId], context.previousMovie);
      }
      toast.error(err?.en || 'Failed to rate movie. Please try again.');
    },
    onSettled: () => {
      const stringId = String(movieId);
      queryClient.invalidateQueries({ queryKey: ['movie', stringId] });
    },
  });
};

export const useAddMovieReview = (movieId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => movieReviewService.addMovieReview({ movieId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieReviews', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movie'] });
    },
  });
};

export const useUpdateMovieReview = (movieId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => movieReviewService.updateMovieReview({ movieId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieReviews', movieId] });
    },
  });
};

export const useDeleteMovieReview = (movieId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => movieReviewService.deleteMovieReview(movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieReviews', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movie'] });
    },
  });
};
