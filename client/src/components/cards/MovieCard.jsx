import React, { memo } from 'react';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';

const MovieCard = memo(({ movie, progress, isRowItem = false }) => {
  if (!movie) {
    return null;
  }
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  
  let displayImage = null;
  displayImage = movie.posterUrl || movie.imageUrl || (movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null) || movie.backdropUrl;
  const containerWidthClass = (isRowItem ? 'w-36 sm:w-48 lg:w-56' : 'w-full');
  const titleClass = `mt-2 text-xs sm:text-sm text-zinc-300 font-bold px-1 text-center ${containerWidthClass} min-h-[1.25rem] line-clamp-2`;

  return (
    <div className="flex flex-col group/card cursor-pointer items-center w-full">
      <div className={`relative flex-shrink-0 transition-transform duration-300 ease-out hover:scale-105 hover:z-30 rounded-md overflow-hidden bg-zinc-900 ${containerWidthClass} aspect-[2/3]`}>
        {displayImage ? (
          <img src={displayImage} alt={movie.title} className="w-full h-full object-cover transition-all duration-300" />
        ) : (
           <div className="w-full h-full flex flex-col justify-center items-center text-zinc-500 border border-zinc-800">
             <span className="text-xs">No Image</span>
           </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-center items-center p-3 sm:p-4 opacity-0 transition-opacity duration-300 bg-black/40">
        </div>
      </div>

      <h4 className={titleClass}>
        {movie.title}
      </h4>
    </div>
  );
});

export default MovieCard;