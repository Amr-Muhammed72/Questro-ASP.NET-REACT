import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, Globe2, Users, Trash2, Bookmark, BookmarkCheck } from 'lucide-react';
import OptimizedImage from '../../../components/common/OptimizedImage';

const MovieCard = memo(({ movie, isRowItem = false, onRemove }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);

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

  const handleWishlist = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisting) return;
    setIsWishlisting(true);
    try {
      const res = await fetch(`http://localhost:5222/api/movie-interactions/${movie.tmdbId || movie.id}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setIsWishlisted(prev => !prev);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setIsWishlisting(false);
    }
  }, [isWishlisting, movie.tmdbId, movie.id]);

  return (
    <Link to={`/movies/${movie.tmdbId || movie.id}`} className="flex flex-col group/card cursor-pointer items-center w-full no-underline text-inherit">
      <div className={`relative flex-shrink-0 transition-all duration-500 ease-out hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-rose-500/40 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 ${containerWidthClass} aspect-[2/3] border border-zinc-700/50 hover:border-rose-500/50`}>

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

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-900/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-300" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300">

          {/* Top Section */}
          <div className="flex justify-between items-start transform translate-y-[-10px] opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-75">

            {/* MPAA Certification — top left */}
            {movie.mpaCertification ? (
              <div className="bg-white/10 backdrop-blur-md text-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold border border-white/20">
                {movie.mpaCertification}
              </div>
            ) : <div />}

            {/* Right side buttons — top right */}
            <div className="flex items-center gap-1.5">

              {/* Watchlist button */}
              <button
                onClick={handleWishlist}
                disabled={isWishlisting}
                className={`flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-md text-white transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110
                  ${isWishlisted
                    ? 'bg-rose-500/90 hover:bg-rose-600 border border-rose-400/50 shadow-rose-500/40'
                    : 'bg-black/60 hover:bg-black/80 border border-white/15'
                  }`}
                title={isWishlisted ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {isWishlisting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isWishlisted ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>

              {/* Remove button */}
              {onRemove && (
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/90 hover:bg-red-600 backdrop-blur-md text-white transition-all duration-200 shadow-lg hover:shadow-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
                  title="Remove from collection"
                >
                  {isRemoving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-3 transform translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-100">

            {movie.tmdbRating > 0 && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-rose-500 px-2.5 py-1 rounded-full text-xs font-bold border border-white/10 shadow-lg w-fit">
                <Star className="w-3.5 h-3.5 fill-current" />
                {movie.tmdbRating.toFixed(1)}
              </div>
            )}

            <div className="flex items-center justify-between text-zinc-300 text-xs font-medium">
              {releaseYear && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  {releaseYear}
                </div>
              )}
              {movie.language && (
                <div className="flex items-center gap-1 uppercase">
                  <Globe2 className="w-3.5 h-3.5 text-zinc-400" />
                  {movie.language}
                </div>
              )}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.slice(0, 3).map((genre, index) => (
                  <span key={genre.id || index} className="text-[10px] font-medium bg-white/10 backdrop-blur-md text-zinc-200 px-2.5 py-1 rounded-md border border-white/5">
                    {genre.name || genre}
                  </span>
                ))}
              </div>
            )}

            {movie.tmdbVoteCount > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium mt-1 pt-3 border-t border-white/10">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{movie.tmdbVoteCount.toLocaleString()} Votes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <h4 className={titleClass} title={movie.title}>
        {movie.title}
      </h4>
    </Link>
  );
});

MovieCard.displayName = 'MovieCard';
export default MovieCard;