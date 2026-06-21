import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, Globe2, Users, Trash2 } from 'lucide-react';
import OptimizedImage from '../../../components/common/OptimizedImage';

const MovieCard = memo(({ movie, isRowItem = false, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const movieId = movie?.tmdbId || movie?.id;

  if (!movie) return null;

  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  const displayImage = movie.posterUrl || movie.imageUrl || (movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null) || movie.backdropUrl;
  const containerWidthClass = isRowItem ? 'w-36 sm:w-48 lg:w-56' : 'w-full';
  const titleClass = `mt-3 text-xs sm:text-sm text-zinc-200 font-semibold px-1 text-center ${containerWidthClass} min-h-[2.5rem] line-clamp-2`;
  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
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
    <Link to={`/movies/${movieId}`} className={`group/card flex flex-col cursor-pointer bg-[#09090b]/60 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-2 hover:bg-white/5 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1.5 transition-all duration-500 w-full ${containerWidthClass}`}>
      <div className={`relative flex-shrink-0 rounded-[1.1rem] overflow-hidden bg-zinc-900 w-full aspect-[2/3] border border-white/5`}>

        {displayImage ? (
          <OptimizedImage
            src={displayImage}
            alt={movie.title}
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
            {/* MPAA Certification */}
            {movie.mpaCertification ? (
              <div className="bg-black/60 backdrop-blur-md text-zinc-200 px-2 py-1 rounded text-[10px] font-bold border border-white/10 shadow-lg">
                {movie.mpaCertification}
              </div>
            ) : <div />}

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
            {movie.tmdbRating > 0 && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-indigo-400 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-500/30 shadow-lg w-fit">
                <Star className="w-3.5 h-3.5 fill-current" />
                {(movie.tmdbRating).toFixed(1)} <span className="text-[10px] text-indigo-400/70 font-normal">/10</span>
              </div>
            )}

            <div className="flex items-center justify-between text-zinc-300 text-[10px] sm:text-xs font-medium">
              {releaseYear && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                  {releaseYear}
                </div>
              )}
              {movie.language && (
                <div className="flex items-center gap-1 uppercase">
                  <Globe2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400" />
                  {movie.language}
                </div>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {movie.genres.slice(0, 3).map((genre, index) => (
                  <span key={genre.id || index} className="text-[9px] sm:text-[10px] font-medium bg-white/10 backdrop-blur-md text-zinc-200 px-2 py-0.5 rounded-md border border-white/5">
                    {genre.name || genre}
                  </span>
                ))}
              </div>
            )}

            {Number(movie.rating) > 0 && (
              <div className="bg-zinc-900/80 backdrop-blur-md px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border border-yellow-500/30 flex items-center gap-1 shadow-lg">
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-yellow-500">
                  {(Number(movie.rating) * 2).toFixed(1)} <span className="text-[10px] text-yellow-500/70 font-normal">/10</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 mb-2 px-2 flex flex-col items-center justify-center text-center">
        <h4 className="text-xs sm:text-sm text-zinc-100 font-bold line-clamp-2 leading-snug tracking-wide" title={movie.title}>
          {movie.title}
        </h4>
      </div>
    </Link>
  );
});

MovieCard.displayName = 'MovieCard';
export default MovieCard;