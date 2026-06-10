import { memo, useState } from 'react';
import { Star, Calendar, X, Trash2 } from 'lucide-react';
import OptimizedImage from '../../../components/common/OptimizedImage';

const LibraryCard = memo(({ item, isMovie = true, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  if (!item) return null;

  const displayImage = isMovie ? item.posterUrl : item.backgroundImage;
  const title = isMovie ? item.title : item.name;
  const releaseDate = isMovie ? item.releaseDate : item.released;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;

  const sizes = '(min-width: 1280px) 20rem, (min-width: 1024px) 16rem, (min-width: 640px) 12rem, 10rem';

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
    <div className="flex flex-col group/card items-center w-full">
      <div className="relative flex-shrink-0 transition-all duration-500 ease-out hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-purple-500/40 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 w-full aspect-[2/3] border border-zinc-700/50 hover:border-purple-500/50">

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

        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-900/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-300" />

        {/* Hover Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300">

          {/* Top Section: Remove Button */}
          <div className="flex justify-between items-start">
            <div />
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/90 hover:bg-red-600 backdrop-blur-md text-white transition-all duration-200 shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform translate-y-[-8px] opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 delay-75 group-hover/card:hover:scale-110"
              title="Remove from collection"
            >
              {isRemoving ? (
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Bottom Section: Details */}
          <div className="flex flex-col gap-3">
            {/* Rating */}
            {item.rating > 0 && (
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-500/30 shadow-lg transform translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-100 w-fit">
                <Star className="w-3.5 h-3.5 fill-current" />
                {Number(item.rating).toFixed(1)}
              </div>
            )}

            {/* Release Year */}
            {releaseYear && (
              <div className="flex items-center gap-2 text-zinc-200 text-xs font-medium transform translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-125">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>{releaseYear}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      <h4 className="mt-3 text-xs sm:text-sm text-zinc-200 font-semibold px-1 text-center w-full min-h-[2.5rem] line-clamp-2 group-hover/card:text-purple-300 transition-colors duration-300" title={title}>
        {title}
      </h4>
    </div>
  );
});

LibraryCard.displayName = 'LibraryCard';
export default LibraryCard;
