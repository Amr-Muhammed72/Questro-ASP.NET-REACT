import { memo } from 'react';
import { Star, Calendar } from 'lucide-react';
import OptimizedImage from '../../../components/common/OptimizedImage';

const LibraryCard = memo(({ item, isMovie = true }) => {
  if (!item) return null;

  const displayImage = isMovie ? item.posterUrl : item.backgroundImage;
  const title = isMovie ? item.title : item.name;
  const releaseDate = isMovie ? item.releaseDate : item.released;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;

  const sizes = '(min-width: 1280px) 20rem, (min-width: 1024px) 16rem, (min-width: 640px) 12rem, 10rem';

  return (
    <div className="flex flex-col group/card cursor-pointer items-center w-full">
      <div className="relative flex-shrink-0 transition-all duration-500 ease-out hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-indigo-500/20 rounded-xl overflow-hidden bg-zinc-900 w-full aspect-[2/3]">

        {displayImage ? (
          <OptimizedImage
            src={displayImage}
            alt={title}
            sizes={sizes}
            className="absolute inset-0 transition-transform duration-700 group-hover/card:scale-110"
            imgClassName="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center text-zinc-500 border border-zinc-800 bg-zinc-900/50">
            <span className="text-xs font-medium tracking-wider uppercase">No Image</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-transparent backdrop-blur-[2px]">

          {/* Top Section: Rating Pill */}
          <div className="flex justify-end transform translate-y-[-10px] opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-75">
            {item.rating > 0 && (
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-yellow-500 px-2.5 py-1 rounded-full text-xs font-bold border border-white/10 shadow-lg">
                <Star className="w-3.5 h-3.5 fill-current" />
                {Number(item.rating).toFixed(1)}
              </div>
            )}
          </div>

          {/* Bottom Section: Release Year */}
          <div className="flex flex-col gap-3 transform translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-100">
            {releaseYear && (
              <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {releaseYear}
              </div>
            )}
          </div>

        </div>
      </div>

      <h4 className="mt-3 text-xs sm:text-sm text-zinc-200 font-semibold px-1 text-center w-full min-h-[2.5rem] line-clamp-2" title={title}>
        {title}
      </h4>
    </div>
  );
});

export default LibraryCard;
