import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, MonitorPlay, Trash2 } from 'lucide-react';
import OptimizedImage from '../../../components/common/OptimizedImage';

const GameCard = memo(({ game, isRowItem = false, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  if (!game) return null;
  const gameId = game.rawgId || game.id;
  const displayImage = game.posterUrl || game.backgroundImage;
  const title = game.title || game.name;

  const containerWidthClass = isRowItem ? 'w-36 sm:w-48 lg:w-56' : 'w-full';
  const titleClass = `mt-3 text-xs sm:text-sm text-zinc-200 font-semibold px-1 text-center ${containerWidthClass} min-h-[2.5rem] line-clamp-2`;
  const rawRelease = game.releaseDate || game.released;
  const releaseYear = rawRelease ? new Date(rawRelease).getFullYear() : null;
  const sizes = isRowItem
    ? '(min-width: 1280px) 14rem, (min-width: 1024px) 12rem, (min-width: 640px) 10rem, 9rem'
    : '(min-width: 1280px) 20rem, (min-width: 1024px) 16rem, (min-width: 640px) 12rem, 10rem';

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) {
      setIsRemoving(true);
      try {
        await onRemove();
      } finally {
        setIsRemoving(false);
      }
    }
  };

  return (
    <Link to={`/games/${gameId}`} className="flex flex-col group/card cursor-pointer items-center w-full no-underline text-inherit">
      <div className={`relative flex-shrink-0 hover-pro hover:scale-105 hover:z-30 rounded-xl overflow-hidden bg-zinc-900 ${containerWidthClass} aspect-[2/3] border border-zinc-700/50`}>

        {displayImage ? (
          <OptimizedImage
            src={displayImage}
            alt={title}
            sizes={sizes}
            className="absolute inset-0 transition-transform duration-700 group-hover/card:scale-110"
            imgClassName="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center text-zinc-500 border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-900">
            <span className="text-xs font-medium tracking-wider uppercase">No Image</span>
          </div>
        )}

        {/* Dynamic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-900/40 to-black/30 opacity-0 group-hover/card:opacity-100 transition-all duration-300" />

        {/* Hover Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300 pointer-events-none group-hover/card:pointer-events-auto">

          {/* Top Section */}
          <div className="flex justify-between items-start transform -translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-75">
            <div />
            
            {/* Remove Button (Library Only) */}
            {onRemove && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md text-red-500 hover:text-red-400 transition-all duration-200 shadow-lg shadow-red-500/20 border border-red-500/30 hover:border-red-500/50 hover:scale-110 disabled:opacity-50"
                  title="Remove from library"
                >
                  {isRemoving ? (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current opacity-80" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2 transform translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-150">
            {game.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-yellow-400 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-500/30 shadow-lg w-fit">
                <Star className="w-3.5 h-3.5 fill-current" />
                {game.rating.toFixed(1)}
              </div>
            )}

            {releaseYear && (
              <div className="flex items-center gap-1.5 text-zinc-300 text-[10px] sm:text-xs font-medium">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                {releaseYear}
              </div>
            )}
            
            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {game.genres.slice(0, 3).map((genre, index) => (
                  <span key={genre.id || index} className="text-[9px] sm:text-[10px] font-medium bg-white/10 backdrop-blur-md text-zinc-200 px-2 py-0.5 rounded-md border border-white/5">
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
            
            {game.platforms && game.platforms.length > 0 && (
              <div className="flex items-start gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 font-medium leading-tight mt-1 pt-2 border-t border-white/10">
                <MonitorPlay className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  {game.platforms.map(p => p.name).join(' • ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <h4 className={titleClass} title={title}>
        {title}
      </h4>
    </Link>
  );
});

GameCard.displayName = 'GameCard';
export default GameCard;