import { memo, useCallback } from 'react';
import { Heart, Bookmark, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuth } from '../../../auth/store/AuthContext';
import {
  useToggleLike,
  useToggleWatchlist,
  useToggleWatched,
} from '../../hooks/useMovieInteractions';

const ActionButton = ({ icon: Icon, label, isActive, onClick, activeColor }) => {
  // Hardcode classes so Tailwind doesn't purge them
  const getActiveStyles = () => {
    switch (activeColor) {
      case 'rose': return 'border-rose-500/50 bg-rose-500/10 text-rose-400';
      case 'indigo': return 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400';
      case 'emerald': return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
      case 'yellow': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500';
      default: return 'border-white/20 bg-white/10 text-white';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer backdrop-blur-md ${
        isActive
          ? getActiveStyles()
          : 'border border-white/10 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:border-white/20'
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'fill-current' : 'text-zinc-300'}`} />
      <span>{label}</span>
    </motion.button>
  );
};

const MovieDetailsActions = memo(({ movieId, userStatus }) => {
  const { isLoggedIn } = useAuth();
  
  const { mutate: toggleLike } = useToggleLike(movieId);
  const { mutate: toggleWatchlist } = useToggleWatchlist(movieId);
  const { mutate: toggleWatched } = useToggleWatched(movieId);

  // Destructure with default values
  const { isLiked = false, isInWatchlist = false, isWatched = false } = userStatus || {};

  // Local state to override watched since backend does not return it in userStatus currently
  const [localWatched, setLocalWatched] = useState(null);
  const displayedWatched = localWatched !== null ? localWatched : isWatched;

  const handleAction = useCallback((actionFn) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to interact.');
      return;
    }
    actionFn();
  }, [isLoggedIn]);

  const handleToggleWatched = useCallback(() => {
    if (!isLoggedIn) {
      toast.error('Please sign in to interact.');
      return;
    }
    setLocalWatched(prev => prev === null ? !isWatched : !prev);
    toggleWatched();
  }, [isLoggedIn, isWatched, toggleWatched]);

  return (
    <div className="flex flex-wrap gap-4">
      <ActionButton
        icon={Heart}
        label={isLiked ? "Movie Liked" : "Like"}
        isActive={isLiked}
        activeColor="rose"
        onClick={() => handleAction(toggleLike)}
      />
      <ActionButton
        icon={Bookmark}
        label={isInWatchlist ? "Movie Watchlist" : "Watchlist"}
        isActive={isInWatchlist}
        activeColor="indigo"
        onClick={() => handleAction(toggleWatchlist)}
      />
      <ActionButton
        icon={Eye}
        label={displayedWatched ? "Watched" : "Mark Watched"}
        isActive={displayedWatched}
        activeColor="emerald"
        onClick={handleToggleWatched}
      />
    </div>
  );
});

MovieDetailsActions.displayName = 'MovieDetailsActions';
export default MovieDetailsActions;
