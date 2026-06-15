import { memo } from 'react';
import { Link } from 'react-router-dom';
import { User, Clapperboard } from 'lucide-react';
import OptimizedImage from '../../../components/common/OptimizedImage';

const ActorCard = memo(({ actor, isRowItem = false }) => {
  if (!actor) return null;

  const profileImage = actor.profileUrl
    ? (actor.profileUrl.startsWith('http')
        ? actor.profileUrl
        : `https://image.tmdb.org/t/p/w500${actor.profileUrl}`)
    : null;

  const containerWidthClass = isRowItem ? 'w-36 sm:w-48 lg:w-56' : 'w-full';
  const titleClass = `mt-3 text-xs sm:text-sm text-zinc-200 font-semibold px-1 text-center ${containerWidthClass} min-h-[2.5rem] line-clamp-2`;

  const sizes = isRowItem
    ? '(min-width: 1280px) 14rem, (min-width: 1024px) 12rem, (min-width: 640px) 10rem, 9rem'
    : '(min-width: 1280px) 20rem, (min-width: 1024px) 16rem, (min-width: 640px) 12rem, 10rem';

  return (
    <Link to={`/actor/${actor.tmdbId}`} className="flex flex-col group/card cursor-pointer items-center w-full no-underline text-inherit">
      <div className={`relative flex-shrink-0 transition-all duration-500 ease-out hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-purple-500/30 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 ${containerWidthClass} aspect-[2/3] border border-zinc-700/50 hover:border-purple-500/50`}>

        {profileImage ? (
          <OptimizedImage
            src={profileImage}
            alt={actor.name}
            sizes={sizes}
            className="absolute inset-0 transition-transform duration-700 group-hover/card:scale-110"
            imgClassName="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center text-zinc-500 border border-zinc-800 bg-gradient-to-br from-zinc-800 to-zinc-900">
            <User className="w-12 h-12 mb-2 text-zinc-600" />
            <span className="text-xs font-medium tracking-wider uppercase">No Photo</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-900/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-300" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover/card:opacity-100 transition-all duration-300">

          {/* Top Section */}
          <div className="flex justify-end items-start transform translate-y-[-10px] opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-75">
            <div className="bg-purple-500/20 backdrop-blur-md text-purple-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-purple-500/30 shadow-lg flex items-center gap-1">
              <User className="w-3 h-3" />
              Actor
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2 transform translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300 delay-100">

            {/* Role / Character */}
            {actor.role && (
              <div className="flex items-center gap-1.5 text-zinc-200 text-xs font-medium">
                <Clapperboard className="w-3.5 h-3.5 text-purple-400" />
                <span className="line-clamp-1">{actor.role}</span>
              </div>
            )}

            {/* Department */}
            {actor.department && (
              <div className="text-[10px] font-medium bg-white/10 backdrop-blur-md text-zinc-200 px-2.5 py-1 rounded-md border border-white/5 w-fit">
                {actor.department}
              </div>
            )}
          </div>

        </div>
      </div>

      <h4 className={titleClass} title={actor.name}>
        {actor.name}
      </h4>
    </Link>
  );
});

ActorCard.displayName = 'ActorCard';
export default ActorCard;
