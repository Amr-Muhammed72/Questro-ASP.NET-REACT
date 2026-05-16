import { memo } from 'react';
import { Star, Calendar, Globe2, Users } from 'lucide-react';
import OptimizedImage from '../../../components/common/OptimizedImage';

const MovieCard = memo(({ movie, isRowItem = false }) => {
  if (!movie) return null;
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  
  const displayImage = movie.posterUrl || movie.imageUrl || (movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null) || movie.backdropUrl;
  const containerWidthClass = isRowItem ? 'w-36 sm:w-48 lg:w-56' : 'w-full';
  const titleClass = `mt-3 text-xs sm:text-sm text-zinc-200 font-semibold px-1 text-center ${containerWidthClass} min-h-[2.5rem] line-clamp-2`;
  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null;
  
  const sizes = isRowItem
    ? '(min-width: 1280px) 14rem, (min-width: 1024px) 12rem, (min-width: 640px) 10rem, 9rem'
    : '(min-width: 1280px) 20rem, (min-width: 1024px) 16rem, (min-width: 640px) 12rem, 10rem';
  return (
    <div className="flex flex-col group/card cursor-pointer items-center w-full">
      <div className={`relative flex-shrink-0 transition-all duration-500 ease-out hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-rose-500/20 rounded-xl overflow-hidden bg-zinc-900 ${containerWidthClass} aspect-[2/3]`}>
        
        {displayImage ? (
          <OptimizedImage
            src={displayImage}
            alt={movie.title}
            sizes={sizes}
            className="absolute inset-0 transition-transform duration-700 group-hover/card:scale-110"
            imgClassName="w-full h-full object-cover absolute inset-0"
          />

        ) : (
           <div className="w-full h-full flex flex-col justify-center items-center text-zinc-500 border border-zinc-800 bg-zinc-900/50">
             <span className="text-xs font-medium tracking-wider uppercase">No Image</span>
           </div>
        )}

        {/* Modern Hover Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-transparent backdrop-blur-[2px]">
          
          {/* Top Section: Rating Pill */}
          <div className="flex justify-between items-start transform translate-y-[-10px] opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-75">
             {/* Optional: MPAA Certification if exists */}
             {movie.mpaCertification ? (
               <div className="bg-white/10 backdrop-blur-md text-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold border border-white/20">
                 {movie.mpaCertification}
               </div>
             ) : <div></div>}

            {movie.tmdbRating > 0 && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-rose-500 px-2.5 py-1 rounded-full text-xs font-bold border border-white/10 shadow-lg">
                <Star className="w-3.5 h-3.5 fill-current" />
                {movie.tmdbRating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Bottom Section: Details */}
          <div className="flex flex-col gap-3 transform translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-100">
            
            {/* Release Year & Language */}
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

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.slice(0, 3).map((genre, index) => (
                  <span 
                    key={genre.id || index} 
                    className="text-[10px] font-medium bg-white/10 backdrop-blur-md text-zinc-200 px-2.5 py-1 rounded-md border border-white/5"
                  >
                    {genre.name || genre}
                  </span>
                ))}
              </div>
            )}
            
            {/* Popularity / Votes */}
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
    </div>
  );
});

export default MovieCard;