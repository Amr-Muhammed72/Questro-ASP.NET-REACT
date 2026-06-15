import { memo, useState, useEffect, useMemo } from 'react';
import { Star, MessageCircle, Pencil, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../auth/store/AuthContext';
import { useProfileStore } from '../../../profile/store/useProfileStore';
import { useMovieReviews } from '../../hooks/useMovieReviews';
import { 
  useAddMovieReview, 
  useRateMovie,
  useUpdateMovieReview,
  useDeleteMovieReview
} from '../../hooks/useMovieInteractions';
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
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md p-4"
          >
             <div className="glassmorphism bg-zinc-900/60 rounded-3xl p-8 shadow-2xl text-center hover:glow-sm transition-all duration-300">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Review?</h3>
                <p className="text-zinc-400 mb-8 text-sm">This action cannot be undone. Your review will be permanently removed.</p>
                
                <div className="flex flex-col gap-3">
                   <button 
                      onClick={onConfirm} 
                      disabled={isPending} 
                      className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
                   >
                      {isPending ? 'Deleting...' : 'Delete Permanently'}
                   </button>
                   <button 
                      onClick={onClose} 
                      disabled={isPending} 
                      className="w-full py-3 rounded-xl font-medium text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                   >
                      Cancel
                   </button>
                </div>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ReviewCard = ({ review, movieId, isMyReview }) => {
  const authorName = review.userName || 'Anonymous';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random&color=fff`;
  
  const formattedDate = new Date(review.timestamp || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editBody, setEditBody] = useState(review.body || review.content || '');
  
  const updateMutation = useUpdateMovieReview(movieId);
  const deleteMutation = useDeleteMovieReview(movieId);

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
         className="py-6 sm:py-8 border-b border-white/5 last:border-0 group"
       >
          <div className="flex flex-col">
             {/* Header */}
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden bg-zinc-800 shadow-lg">
                       <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                       <div className="flex items-center gap-3">
                          <h5 className="font-bold text-white text-base lg:text-lg">{authorName}</h5>
                          <span className="text-sm lg:text-base text-zinc-500 font-medium">{formattedDate}</span>
                       </div>
                    </div>
                 </div>
                {isMyReview && (
                   <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-md">
                      Your Review
                   </span>
                )}
             </div>

             {/* Prominent Rating */}
             {review.rating ? (
                <div className="flex items-center gap-1 mb-3">
                   {[1, 2, 3, 4, 5].map((star) => (
                       <Star 
                          key={star} 
                          className={clsx(
                             "w-5 h-5 lg:w-6 lg:h-6", 
                             star <= Math.round(review.rating) ? "fill-yellow-500 text-yellow-500" : "fill-zinc-800 text-zinc-800"
                          )} 
                       />
                   ))}
                </div>
             ) : null}

             {/* Content */}
             {isEditing ? (
               <div className="flex flex-col gap-3 mt-2">
                 <textarea
                   value={editBody}
                   onChange={(e) => setEditBody(e.target.value)}
                   className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-purple-500/50 transition-all resize-none min-h-[120px] text-sm sm:text-base"
                   disabled={updateMutation.isPending}
                 />
                 <div className="flex justify-end gap-2 mt-1">
                   <button 
                     onClick={() => setIsEditing(false)} 
                     className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                     disabled={updateMutation.isPending}
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleUpdate} 
                     className="px-6 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors disabled:opacity-50"
                     disabled={updateMutation.isPending}
                   >
                     {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                   </button>
                 </div>
               </div>
             ) : (
               <p className="text-zinc-300 text-base sm:text-lg lg:text-xl leading-relaxed whitespace-pre-wrap">
                 {review.body || review.content}
               </p>
             )}

             {/* Actions */}
             {isMyReview && !isEditing && (
                <div className="flex items-center gap-4 mt-5 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                      onClick={() => setIsEditing(true)}                       className="flex items-center gap-2 text-sm lg:text-base font-bold text-zinc-400 hover:text-white transition-colors"
                    >
                       <Pencil className="w-4 h-4 lg:w-5 lg:h-5" />
                       Edit
                    </button>
                    <button 
                       onClick={() => setShowDeleteConfirm(true)} 
                       className="flex items-center gap-2 text-sm lg:text-base font-bold text-zinc-400 hover:text-red-400 transition-colors"
                    >
                       <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                      Delete
                   </button>
                </div>
             )}
          </div>
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

const ReviewComposer = ({ movieId, userRating }) => {
   const { isLoggedIn } = useAuth();
   const rateMovieMutation = useRateMovie(movieId);
   const addReviewMutation = useAddMovieReview(movieId);
   
   const [hoverRating, setHoverRating] = useState(0);
   const [selectedRating, setSelectedRating] = useState(userRating || 0);
   const [reviewBody, setReviewBody] = useState('');
   const [error, setError] = useState('');

   useEffect(() => {
     if (userRating !== undefined) {
       setSelectedRating(userRating || 0);
     }
   }, [userRating]);
 
   const handleStarClick = (rating) => {
     setSelectedRating(rating);
     rateMovieMutation.mutate(rating, {
       onSuccess: () => toast.success('Rating submitted!')
     });
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
         <div className="glassmorphism bg-zinc-900/60 rounded-3xl p-10 sm:p-14 mb-16 flex flex-col items-center justify-center text-center relative group hover:glow-sm transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
               <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight drop-shadow-md">Have you seen this movie?</h3>
            <p className="text-zinc-400 mb-8 max-w-lg text-lg lg:text-xl">Sign in to share your thoughts, rate this movie, and join the conversation.</p>
            <Link
               to="/login"
               className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg hover:shadow-purple-500/25 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
            >
               Sign In to Review
            </Link>
            </div>
         </div>
      );
   }

   return (
      <div className="glassmorphism bg-zinc-900/60 rounded-3xl p-6 sm:p-10 mb-16 relative group hover:glow-sm transition-all duration-500 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
         <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-8 text-center uppercase tracking-widest text-zinc-500">Your Opinion</h3>
         
         <div className="flex flex-col items-center mb-10">
            <span className="text-sm text-zinc-400 font-medium mb-4">
               {selectedRating > 0 ? 'Your Rating' : 'Rate this movie'}
            </span>
            <div className="flex items-center gap-2">
               {[1, 2, 3, 4, 5].map((star) => (
               <Star
                  key={star}
                  className={clsx(
                     "w-10 h-10 sm:w-12 sm:h-12 cursor-pointer transition-all duration-300",
                     star <= (hoverRating || selectedRating)
                        ? "fill-yellow-500 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-110"
                        : "text-zinc-800 hover:text-zinc-600 hover:scale-110"
                  )}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleStarClick(star)}
               />
               ))}
            </div>
         </div>

         <div className="flex flex-col max-w-2xl mx-auto">
            <span className="text-sm text-zinc-400 font-medium mb-3 text-center">Share your thoughts</span>
            <textarea
               value={reviewBody}
               onChange={(e) => {
                  setReviewBody(e.target.value);
                  setError('');
               }}
               placeholder="What did you think about this movie? What stood out to you?"
               className={clsx(
                  "w-full bg-black/20 border border-white/10 rounded-xl p-5 text-zinc-200 placeholder-zinc-500 focus:outline-none transition-all resize-none min-h-[140px] text-sm sm:text-base",
                  error ? "border-red-500" : "focus:border-purple-500/50"
               )}
               maxLength={1000}
               disabled={addReviewMutation.isPending}
            />
            <div className="flex items-center justify-between mt-4">
               <div className="text-xs text-zinc-600 font-medium">
                  {reviewBody.length}/1000
               </div>
               <div className="flex items-center gap-4">
                  {error && <span className="text-sm text-red-400 font-medium">{error}</span>}
                  <button
                     onClick={handleSubmitReview}
                     disabled={!reviewBody.trim() || addReviewMutation.isPending}
                     className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 shadow-lg hover:shadow-purple-500/25 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                     {addReviewMutation.isPending ? 'Publishing...' : 'Publish Review'}
                  </button>
               </div>
            </div>
         </div>
         </div>
      </div>
   );
};

const MovieDetailsReviews = memo(({ movieId, userRating }) => {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMovieReviews(movieId);

  const { myProfile } = useProfileStore();
  const [sortBy, setSortBy] = useState('newest');

  const reviewsList = useMemo(() => data?.pages?.flatMap(page => page.data || []) || [], [data]);

  const sortedReviews = useMemo(() => {
    const list = [...reviewsList];
    let sortedList = [];

    if (sortBy === 'oldest') {
      sortedList = list.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
    } else {
      // newest (default)
      sortedList = list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    }

    // Always pin the current user's review to the top
    if (myProfile) {
      const myReviewIndex = sortedList.findIndex(r => r.userName === myProfile.userName);
      if (myReviewIndex > -1) {
        const [myReview] = sortedList.splice(myReviewIndex, 1);
        sortedList.unshift(myReview);
      }
    }

    return sortedList;
  }, [reviewsList, sortBy, myProfile]);

  if (isLoading) {
    return (
      <div className="py-16 max-w-3xl mx-auto space-y-8">
         <div className="h-64 glassmorphism bg-zinc-900/60 animate-pulse rounded-3xl" />
         <div className="space-y-6">
            {[1, 2, 3].map((i) => (
               <div key={i} className="h-32 glassmorphism bg-zinc-900/60 animate-pulse rounded-3xl" />
            ))}
         </div>
      </div>
    );
  }

  if (isError) return null;
  
  const myReview = myProfile ? reviewsList.find(r => r.userName === myProfile.userName) : null;
  const totalCount = data?.pages?.[0]?.totalCount || 0;

  return (
    <div id="reviews-section" className="py-16 max-w-4xl lg:max-w-5xl mx-auto">
      
      {/* 1. Reviews Header */}
      <div className="text-center mb-16">
         <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 drop-shadow-md">Community Reviews</h2>
         <p className="text-zinc-400 text-lg lg:text-xl">Share your thoughts about this movie</p>
         {totalCount > 0 && (
            <p className="text-base lg:text-lg font-bold text-purple-400 mt-4">
               {totalCount} {totalCount === 1 ? 'Review' : 'Reviews'}
            </p>
         )}
      </div>

      {/* 2. Review Composer */}
      {!myReview && (
         <ReviewComposer movieId={movieId} userRating={userRating} />
      )}

      {/* 3. Community Reviews List */}
      <div>
         {totalCount > 1 && (
            <div className="flex justify-end mb-6">
               <div className="relative">
                  <select 
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value)}
                     className="appearance-none bg-transparent text-zinc-400 hover:text-white text-sm font-medium pl-3 pr-8 py-2 focus:outline-none cursor-pointer transition-colors"
                  >
                     <option value="newest" className="bg-zinc-900 text-white">Newest</option>
                     <option value="oldest" className="bg-zinc-900 text-white">Oldest</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
               </div>
            </div>
         )}

         {reviewsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 glassmorphism bg-zinc-900/60 rounded-3xl mt-4 hover:glow-sm transition-all duration-500">
               <div className="w-20 h-20 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <MessageCircle className="w-10 h-10 text-purple-400/50" />
               </div>
               <h4 className="text-xl font-bold text-white mb-2">No reviews yet</h4>
               <p className="text-zinc-500 text-sm max-w-[260px]">
                  Be the first person to share thoughts about this movie.
               </p>
            </div>
         ) : (
            <div className="flex flex-col">
               <AnimatePresence>
                  {sortedReviews.map((review, index) => {
                     const isMyReview = myProfile && review.userName === myProfile.userName;
                     return (
                        <ReviewCard 
                           key={review.id || index} 
                           review={review} 
                           movieId={movieId}
                           isMyReview={isMyReview} 
                        />
                     );
                  })}
               </AnimatePresence>

               {hasNextPage && (
                  <div className="pt-10 flex justify-center">
                     <button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                     >
                        {isFetchingNextPage ? 'Loading more...' : 'Load More Reviews'}
                     </button>
                  </div>
               )}
            </div>
         )}
      </div>

    </div>
  );
});

MovieDetailsReviews.displayName = 'MovieDetailsReviews';
export default MovieDetailsReviews;
