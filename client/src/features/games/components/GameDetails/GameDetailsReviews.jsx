import { memo, useState, useEffect, useMemo } from 'react';
import { Star, MessageCircle, Pencil, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../auth/store/AuthContext';
import { useProfileStore } from '../../../profile/store/useProfileStore';
import { useGameReviews } from '../../hooks/useGameReviews';
import { 
  useAddGameReview, 
  useUpdateGameReview,
  useDeleteGameReview,
  useRateGame,
  useGameInteractionStatus
} from '../../hooks/useGameInteractions';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isPending }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md p-4"
          >
             <div className="bg-[#111] border border-white/5 rounded-2xl p-8 shadow-2xl text-left">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Review?</h3>
                <p className="text-zinc-400 mb-8 text-sm">This action cannot be undone. Your review will be permanently removed.</p>
                
                <div className="flex gap-3 justify-end">
                   <button 
                      onClick={onClose} 
                      disabled={isPending} 
                      className="px-5 py-2.5 rounded-xl font-medium text-white hover:bg-white/5 transition-colors text-sm disabled:opacity-50"
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={onConfirm} 
                      disabled={isPending} 
                      className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors text-sm disabled:opacity-50"
                   >
                      {isPending ? 'Deleting...' : 'Delete'}
                   </button>
                </div>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ReviewCard = ({ review, gameId, isMyReview }) => {
  const authorName = review.userName || review.username || 'Anonymous';
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff`;
  
  const rawAvatar = review.userProfilePictureUrl || review.userAvatar;
  const [imgSrc, setImgSrc] = useState(() => {
    if (!rawAvatar) return fallbackAvatarUrl;
    return rawAvatar.startsWith('http')
      ? rawAvatar
      : `http://localhost:${import.meta.env.VITE_PORT || 5222}${rawAvatar}`;
  });
  
  const formattedDate = new Date(review.timestamp || review.createdAt || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editBody, setEditBody] = useState(review.body || review.content || review.comment || '');
  
  const updateMutation = useUpdateGameReview(gameId);
  const deleteMutation = useDeleteGameReview(gameId);

  const handleUpdate = () => {
    if (!editBody.trim()) {
      toast.error('Review cannot be empty.');
      return;
    }
    updateMutation.mutate(editBody, {
      onSuccess: () => {
        setIsEditing(false);
        toast.success('Review updated successfully!');
      },
      onError: () => toast.error('Failed to update review.')
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
         setShowDeleteConfirm(false);
         toast.success('Review deleted!');
      },
      onError: () => {
         setShowDeleteConfirm(false);
         toast.error('Failed to delete review.');
      }
    });
  };

  return (
    <>
       <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         className="py-6 border-b border-white/5 last:border-0 group flex flex-col"
       >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
             <Link to={`/users/${review.userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                   <img 
                      src={imgSrc} 
                      alt={authorName} 
                      onError={() => setImgSrc(fallbackAvatarUrl)}
                      className="w-full h-full object-cover" 
                   />
                </div>
                <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                      <h5 className="font-bold text-white text-sm">{authorName}</h5>
                      {isMyReview && (
                         <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded uppercase tracking-wider">
                            You
                         </span>
                      )}
                   </div>
                   <span className="text-xs text-zinc-500 font-medium">{formattedDate}</span>
                </div>
             </Link>
             
             {/* Rating */}
             {review.rating > 0 ? (
                <div className="flex items-center gap-0.5 bg-[#111] px-2 py-1 rounded-lg border border-white/5">
                   {[1, 2, 3, 4, 5].map((star) => (
                       <Star 
                          key={star} 
                          className={clsx(
                             "w-3 h-3", 
                             star <= Math.round(review.rating) ? "fill-yellow-500 text-yellow-500" : "fill-zinc-800 text-zinc-800"
                          )} 
                       />
                   ))}
                </div>
             ) : null}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="flex flex-col mt-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full bg-[#171717] border border-white/10 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-[140px] text-sm"
                disabled={updateMutation.isPending}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdate} 
                  className="px-5 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
              {review.body || review.content || review.comment}
            </p>
          )}

          {/* Actions */}
          {isMyReview && !isEditing && (
             <div className="flex items-center gap-4 mt-4">
                <button 
                   onClick={() => setIsEditing(true)}                       
                   className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                 >
                   <Pencil className="w-3.5 h-3.5" />
                   Edit
                 </button>
                 <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-red-400 transition-colors"
                 >
                    <Trash2 className="w-3.5 h-3.5" />
                   Delete
                </button>
             </div>
          )}
       </motion.div>
       
       <DeleteConfirmationModal 
          isOpen={showDeleteConfirm} 
          onClose={() => setShowDeleteConfirm(false)} 
          onConfirm={handleDelete} 
          isPending={deleteMutation.isPending} 
       />
    </>
  );
};

const ReviewComposer = ({ gameId, userRating, hasReviewed }) => {
   const { isLoggedIn } = useAuth();
   const addReviewMutation = useAddGameReview(gameId);
   const rateGameMutation = useRateGame(gameId);
   
   const [hoverRating, setHoverRating] = useState(0);
   const [selectedRating, setSelectedRating] = useState(userRating || 0);
   const [reviewBody, setReviewBody] = useState('');
   const [error, setError] = useState('');

   useEffect(() => {
     if (userRating !== undefined) {
       setSelectedRating(userRating || 0);
     }
   }, [userRating]);

   const handleSaveRating = () => {
     if (selectedRating > 0) {
       rateGameMutation.mutate(selectedRating, {
         onSuccess: () => toast.success('Rating saved!'),
         onError: () => toast.error('Failed to save rating.')
       });
     }
   };

   const handleSubmitReview = () => {
      if (!reviewBody.trim()) {
        setError('Review cannot be empty.');
        return;
      }
      setError('');
      
      addReviewMutation.mutate(reviewBody, {
        onSuccess: () => {
          setReviewBody('');
          toast.success('Review posted successfully!');
        },
        onError: (err) => {
          setError(err?.message || 'Failed to post review. Please try again.');
        }
      });
   };

   if (!isLoggedIn) {
      return (
         <div className="bg-[#111] rounded-2xl p-8 flex flex-col items-start border border-white/5">
            <h3 className="text-xl font-bold text-white mb-2">Your Opinion</h3>
            <p className="text-zinc-400 mb-6 text-sm">Sign in to share your thoughts and rate this game.</p>
            <Link
               to="/login"
               className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/20"
            >
               Sign In to Review
            </Link>
         </div>
      );
   }

   return (
      <div className="bg-[#111] rounded-2xl p-8 border border-white/5 shadow-xl">
         <h3 className="text-xl font-bold text-white mb-6">Your Opinion</h3>
         
         {/* Rating Section - Always Visible */}
         <div className={clsx("flex flex-col", !hasReviewed && "mb-8 pb-8 border-b border-white/5")}>
            <span className="text-sm text-zinc-400 font-medium mb-3">
               {selectedRating > 0 ? 'Your Rating' : 'Rate this game'}
            </span>
            <div className="flex items-center gap-1 mb-5">
               {[1, 2, 3, 4, 5].map((star) => (
               <Star
                  key={star}
                  className={clsx(
                     "w-8 h-8 cursor-pointer transition-colors",
                     star <= (hoverRating || selectedRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-zinc-700 hover:text-zinc-500"
                  )}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setSelectedRating(star)}
               />
               ))}
            </div>
            <button
               onClick={handleSaveRating}
               disabled={selectedRating === 0 || rateGameMutation.isPending || selectedRating === userRating}
               className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors w-fit"
            >
               {rateGameMutation.isPending ? 'Saving...' : 'Save Rating'}
            </button>
         </div>

         {/* Review Section - Only visible if not already reviewed */}
         {!hasReviewed ? (
            <div className="flex flex-col mt-8">
               <span className="text-sm text-zinc-400 font-medium mb-3">Write a review</span>
               <textarea
                  value={reviewBody}
                  onChange={(e) => {
                     setReviewBody(e.target.value);
                     setError('');
                  }}
                  placeholder="What did you think about this game?"
                  className={clsx(
                     "w-full bg-[#171717] border border-white/10 rounded-xl p-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-[140px] text-sm",
                     error && "border-red-500"
                  )}
                  maxLength={1000}
                  disabled={addReviewMutation.isPending}
               />
               <div className="flex flex-col gap-3 mt-3">
                  <div className="flex items-center justify-between">
                     <div className="text-xs text-zinc-500 font-medium">
                        {reviewBody.length}/1000
                     </div>
                     {error && <span className="text-sm text-red-400 font-medium">{error}</span>}
                  </div>
                  <button
                     onClick={handleSubmitReview}
                     disabled={!reviewBody.trim() || addReviewMutation.isPending}
                     className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/20"
                  >
                     {addReviewMutation.isPending ? 'Publishing...' : 'Publish Review'}
                  </button>
               </div>
            </div>
         ) : (
            <div className="mt-6 pt-6 border-t border-white/5">
               <p className="text-zinc-400 text-sm">
                  You have already shared your written review. You can edit or delete it from the community list.
               </p>
            </div>
         )}
      </div>
   );
};

const GameDetailsReviews = memo(({ gameId }) => {
  const { isLoggedIn } = useAuth();
  const { data: interactionStatus } = useGameInteractionStatus(gameId, isLoggedIn);
  const userRating = interactionStatus?.userRating || 0;

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useGameReviews(gameId);

  const { myProfile } = useProfileStore();
  const [sortBy, setSortBy] = useState('newest');

  const reviewsList = useMemo(() => data?.pages?.flatMap(page => page.data || []) || [], [data]);

  const sortedReviews = useMemo(() => {
    const list = [...reviewsList];
    let sortedList = [];

    if (sortBy === 'oldest') {
      sortedList = list.sort((a, b) => new Date(a.timestamp || a.createdAt || 0) - new Date(b.timestamp || b.createdAt || 0));
    } else {
      // newest (default)
      sortedList = list.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));
    }

    // Always pin the current user's review to the top
    if (myProfile) {
      const myReviewIndex = sortedList.findIndex(r => r.userName === myProfile.userName || r.username === myProfile.userName);
      if (myReviewIndex > -1) {
        const [myReview] = sortedList.splice(myReviewIndex, 1);
        sortedList.unshift(myReview);
      }
    }

    return sortedList;
  }, [reviewsList, sortBy, myProfile]);

  if (isLoading) {
    return (
      <div className="py-12 max-w-[1200px] mx-auto px-4 w-full">
         <div className="mb-10 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Community Reviews</h2>
            <p className="text-zinc-400 text-sm">Share your thoughts and see what others think</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="order-1 lg:order-2 lg:col-span-4 lg:sticky lg:top-24 h-[400px] bg-[#111] animate-pulse rounded-2xl border border-white/5" />
            
            <div className="order-2 lg:order-1 lg:col-span-8 flex flex-col">
               {/* Skeleton for reviews header */}
               <div className="flex items-center justify-between mb-6">
                  <div className="w-24 h-6 bg-[#111] animate-pulse rounded" />
                  <div className="w-32 h-9 bg-[#111] animate-pulse rounded-lg" />
               </div>
               
               {/* Skeleton for review cards */}
               <div className="flex flex-col space-y-6">
                  {[1, 2, 3].map((i) => (
                     <div key={i} className="h-40 bg-[#111] animate-pulse rounded-2xl border border-white/5" />
                  ))}
               </div>
            </div>
         </div>
      </div>
    );
  }

  if (isError) return null;
  
  const myReview = myProfile ? reviewsList.find(r => r.userName === myProfile.userName || r.username === myProfile.userName) : null;
  const totalCount = data?.pages?.[0]?.totalCount || reviewsList.length || 0;

  return (
    <div id="reviews-section" className="py-12 max-w-[1200px] mx-auto px-4 w-full">
      
      {/* 1. Section Header */}
      <div className="mb-10 text-left">
         <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Community Reviews</h2>
         <p className="text-zinc-400 text-sm">Share your thoughts and see what others think</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
         
         {/* Right Side (Desktop) / Top (Mobile): Your Opinion (Composer) */}
         <div className="order-1 lg:order-2 lg:col-span-4 lg:sticky lg:top-24">
            <ReviewComposer gameId={gameId} userRating={userRating} hasReviewed={!!myReview} />
         </div>

         {/* Left Side (Desktop) / Bottom (Mobile): Community Reviews List */}
         <div className="order-2 lg:order-1 lg:col-span-8 flex flex-col">
            {/* Reviews List Header */}
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-white">
                  {totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'Review' : 'Reviews'}` : 'Reviews'}
               </h3>
               {totalCount > 1 && (
                  <div className="relative">
                     <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none bg-[#111] border border-white/5 text-zinc-300 text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                     >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                     </select>
                     <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
               )}
            </div>

            {/* Community Reviews List */}
            <div>
               {reviewsList.length === 0 ? (
                  <div className="bg-[#111] rounded-2xl p-8 border border-white/5 flex flex-col items-start shadow-xl">
                     <MessageCircle className="w-8 h-8 text-zinc-600 mb-4" />
                     <h4 className="text-lg font-bold text-white mb-1">No reviews yet</h4>
                     <p className="text-zinc-500 text-sm">
                        Be the first to share your thoughts about this game.
                     </p>
                  </div>
               ) : (
                  <div className="flex flex-col">
                     <AnimatePresence>
                        {sortedReviews.map((review, index) => {
                           const isMyReview = myProfile && (review.userName === myProfile.userName || review.username === myProfile.userName);
                           return (
                              <ReviewCard 
                                 key={review.id || review.reviewId || index} 
                                 review={review} 
                                 gameId={gameId}
                                 isMyReview={isMyReview} 
                              />
                           );
                        })}
                     </AnimatePresence>

                     {hasNextPage && (
                        <div className="pt-8 flex justify-center">
                           <button
                              onClick={() => fetchNextPage()}
                              disabled={isFetchingNextPage}
                              className="px-6 py-2.5 bg-[#111] border border-white/5 hover:bg-[#171717] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                           >
                              {isFetchingNextPage ? 'Loading more...' : 'Load More Reviews'}
                           </button>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
});

GameDetailsReviews.displayName = 'GameDetailsReviews';
export default GameDetailsReviews;
