import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import gameInteractionService from '../api/gameInteractionService';
import gameReviewService from '../api/gameReviewService';

export const useGameInteractionStatus = (gameId, isLoggedIn) => {
  return useQuery({
    queryKey: ['gameInteraction', gameId],
    queryFn: () => gameInteractionService.getInteractionStatus(gameId),
    enabled: !!gameId && !!isLoggedIn,
  });
};

const createOptimisticToggle = (queryClient, gameId, actionType) => {
  return {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['gameInteraction', gameId] });
      const previousStatus = queryClient.getQueryData(['gameInteraction', gameId]);

      queryClient.setQueryData(['gameInteraction', gameId], (old) => {
        if (!old) return old;
        return {
          ...old,
          [actionType]: !old[actionType],
        };
      });

      return { previousStatus };
    },
    onError: (err, variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(['gameInteraction', gameId], context.previousStatus);
      }
      toast.error('Failed to update interaction. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gameInteraction', gameId] });
    },
  };
};

export const useToggleGameLike = (gameId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gameInteractionService.toggleLike(gameId),
    ...createOptimisticToggle(queryClient, gameId, 'isLiked'),
  });
};

export const useToggleGameWatchlist = (gameId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gameInteractionService.toggleWatchlist(gameId),
    ...createOptimisticToggle(queryClient, gameId, 'isInWatchlist'),
  });
};

export const useRateGame = (gameId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stars) => gameInteractionService.rateGame({ gameId, stars }),
    onSuccess: () => {
      // Rating removes from wishlist as a side effect
      queryClient.invalidateQueries({ queryKey: ['gameInteraction', gameId] });
    },
  });
};

export const useAddGameReview = (gameId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => gameReviewService.addGameReview({ gameId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameReviews', gameId] });
      queryClient.invalidateQueries({ queryKey: ['gameInteraction', gameId] }); // side effect: removes wishlist
    },
  });
};

export const useUpdateGameReview = (gameId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => gameReviewService.updateGameReview({ gameId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameReviews', gameId] });
      queryClient.invalidateQueries({ queryKey: ['gameInteraction', gameId] }); // side effect: removes wishlist
    },
  });
};

export const useDeleteGameReview = (gameId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gameReviewService.deleteGameReview(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameReviews', gameId] });
      queryClient.invalidateQueries({ queryKey: ['gameInteraction', gameId] });
    },
  });
};
