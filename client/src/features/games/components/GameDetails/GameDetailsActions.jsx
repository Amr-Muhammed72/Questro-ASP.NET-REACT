import { memo, useCallback, useState, useEffect } from 'react';
import { Heart, Bookmark, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../../auth/store/AuthContext';
import { 
  useToggleGameLike, 
  useToggleGameWatchlist, 
  useGameInteractionStatus 
} from '../../hooks/useGameInteractions';

const ActionButton = ({ icon: Icon, label, isActive, onClick, activeColor }) => {
  const getActiveStyles = () => {
    switch (activeColor) {
      case 'rose': return 'border-rose-500/50 bg-rose-500/10 text-rose-400';
      case 'indigo': return 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400';
      case 'emerald': return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
      default: return 'border-white/20 bg-white/10 text-white';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center justify-center w-[110px] md:w-[130px] gap-2 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all duration-200 cursor-pointer backdrop-blur-md ${
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

const GameDetailsActions = memo(({ gameId }) => {
  const { isLoggedIn } = useAuth();
  
  const { mutate: toggleLike } = useToggleGameLike(gameId);
  const { mutate: toggleWatchlist } = useToggleGameWatchlist(gameId);
  const { data: interactionStatus } = useGameInteractionStatus(gameId, isLoggedIn);

  // Destructure with default values
  const { isLiked = false, isInWishlist = false } = interactionStatus || {};

  const handleAction = useCallback((actionFn) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to interact.');
      return;
    }
    actionFn();
  }, [isLoggedIn]);

  return (
    <div className="flex flex-wrap gap-4">
      <ActionButton
        icon={Heart}
        label={isLiked ? "Liked" : "Like"}
        isActive={isLiked}
        activeColor="rose"
        onClick={() => handleAction(toggleLike)}
      />
      <ActionButton
        icon={Bookmark}
        label={isInWishlist ? "Wishlisted" : "Wishlist"}
        isActive={isInWishlist}
        activeColor="indigo"
        onClick={() => handleAction(toggleWatchlist)}
      />
    </div>
  );
});

GameDetailsActions.displayName = 'GameDetailsActions';
export default GameDetailsActions;
