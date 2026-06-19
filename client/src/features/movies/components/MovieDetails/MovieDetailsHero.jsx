import { memo, useState, useEffect } from 'react';
import { Star, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MovieDetailsActions from './MovieDetailsActions';



const getYoutubeEmbed = (url) => {
  if (!url) return null;

  let videoId = "";
  if (url.includes("watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1];
  } else {
    videoId = url;
  }

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0`;
};

const MovieDetailsHero = memo(({ movie }) => {
  const {
    title,
    backdropUrl,
    posterUrl,
    releaseDate,
    runtime,
    tmdbRating,
    ratingSummary,
    genres,
    overview,
    trailerUrl,
    watchProviders,
  } = movie;

  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const embedUrl = getYoutubeEmbed(trailerUrl);

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsTrailerOpen(false);
    };
    if (isTrailerOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isTrailerOpen]);

  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const hours = runtime ? Math.floor(runtime / 60) : 0;
  const minutes = runtime ? runtime % 60 : 0;
  const formattedRuntime = runtime ? `${hours}h ${minutes}m` : 'N/A';

  // Get unique providers sorted by priority
  const uniqueProviders = (() => {
    if (!watchProviders) return [];
    const allProviders = [
      ...(watchProviders.flatrate || []),
      ...(watchProviders.rent || []),
      ...(watchProviders.buy || [])
    ];
    const unique = [];
    const seen = new Set();
    for (const p of allProviders) {
      if (!seen.has(p.providerId)) {
        seen.add(p.providerId);
        unique.push(p);
      }
    }
    return unique.sort((a, b) => a.displayPriority - b.displayPriority).slice(0, 4);
  })();

  return (
    <div className="relative w-full min-h-[100svh] bg-[#09090b] flex items-center pt-32 pb-48 lg:pt-40 lg:pb-56 overflow-hidden">
      {/* Background Image & Overlays */}
      <div className="absolute inset-0 overflow-hidden bg-[#09090b]">
        {backdropUrl && (
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-top filter blur-[2px] opacity-60"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {/* Vibrant color overlays for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-[#09090b]/80 to-indigo-900/40 mix-blend-overlay z-10" />
        
        {/* Soft radial melt from center */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#09090b_100%)] opacity-80 z-10" />
        
        {/* Heavy bottom fade for melted seamless transition */}
        <div className="absolute bottom-0 left-0 right-0 h-64 sm:h-80 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent z-10" />
      </div>

      <div className="w-full max-w-screen-2xl relative z-20 mx-auto px-4 md:px-8 lg:px-12 xl:px-16 flex items-center">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 md:gap-12 lg:gap-16 w-full">
          
          {/* Floating Poster */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => {
              if (embedUrl) {
                setIsTrailerOpen(true);
              } else {
                toast.error("No trailer available for this movie.");
              }
            }}
            className="w-36 sm:w-48 lg:w-72 xl:w-80 aspect-[2/3] flex-shrink-0 relative z-30 bg-zinc-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group border border-white/10 cursor-pointer"
          >
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${title} Poster`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <span className="text-6xl">🎬</span>
              </div>
            )}
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 w-full flex flex-col items-center lg:items-start text-center lg:text-left pt-4 md:pt-8 lg:pt-0 lg:pl-8 pb-10 lg:pb-0"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white mb-6 drop-shadow-2xl">
              {title}
            </h1>

            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 text-zinc-300 font-semibold mb-8">
              <span className="bg-white/10 px-3 py-1 lg:px-4 lg:py-1.5 rounded-lg text-xs lg:text-sm border border-white/10 shadow-sm">
                {year}
              </span>
              <span>•</span>
              <span className="bg-white/10 px-3 py-1 lg:px-4 lg:py-1.5 rounded-lg text-xs lg:text-sm border border-white/10 shadow-sm">
                {formattedRuntime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 lg:px-4 lg:py-1.5 rounded-lg text-xs lg:text-sm border border-white/10 shadow-sm text-yellow-500 font-bold">
                <Star className="w-4 h-4 fill-yellow-500" />
                {tmdbRating ? tmdbRating.toFixed(1) : 'N/A'} <span className="text-zinc-400 text-[10px] lg:text-xs font-normal">/10</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-10">
              {genres?.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 lg:px-4 lg:py-1.5 bg-white/5 border border-white/10 text-zinc-200 rounded-lg text-xs lg:text-sm font-bold tracking-wide shadow-sm hover:bg-white/10 transition-colors"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 md:gap-10 mb-10 w-full">
              {uniqueProviders.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-xs lg:text-sm text-zinc-400 font-bold uppercase tracking-wider text-center lg:text-left">Available On</span>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 lg:gap-3">
                    {uniqueProviders.map(provider => {
                      const providerLink = watchProviders?.link;
                      const logoSrc = provider.logoUrl?.startsWith('http') 
                        ? provider.logoUrl 
                        : `https://image.tmdb.org/t/p/original${provider.logoUrl}`;
                        
                      const ProviderContent = (
                        <div 
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden bg-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-white/10 hover:border-purple-500/50 hover:scale-110 hover:-translate-y-1 transition-all duration-300 group-hover:shadow-purple-500/20 relative flex items-center justify-center"
                          title={provider.providerName}
                        >
                          <span className="text-xs font-bold text-zinc-500 uppercase absolute text-center leading-tight">
                            {provider.providerName?.substring(0, 2)}
                          </span>
                          <img 
                            src={logoSrc} 
                            alt={provider.providerName}
                            className="w-full h-full object-cover relative z-10"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      );

                      return providerLink ? (
                        <a
                          key={provider.providerId}
                          href={providerLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group"
                        >
                          {ProviderContent}
                        </a>
                      ) : (
                        <div key={provider.providerId} className="group cursor-pointer">
                          {ProviderContent}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {overview && (
              <p className="text-zinc-300 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-4xl mb-12 drop-shadow-md line-clamp-4 sm:line-clamp-none">
                {overview}
              </p>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 w-full sm:w-auto mt-auto">
              {embedUrl && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center justify-center w-full sm:w-[160px] gap-2 py-3 lg:py-2.5 bg-white text-black text-sm lg:text-base font-black rounded-xl hover:bg-zinc-200 transition-transform shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105 cursor-pointer"
                >
                  <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-black" />
                  Watch Trailer
                </button>
              )}
              <MovieDetailsActions movieId={movie.tmdbId} userStatus={movie.userStatus} />
            </div>
          </motion.div>

        </div>
      </div>

      {/* Trailer Modal Overlay */}
      <AnimatePresence>
        {isTrailerOpen && embedUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setIsTrailerOpen(false)}
          >
            <div className="w-full max-w-5xl flex justify-end mb-4">
              <button 
                onClick={() => setIsTrailerOpen(false)}
                className="w-12 h-12 bg-white/10 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div 
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              onClick={e => e.stopPropagation()}
            >
              <iframe
                className="w-full h-full"
                src={embedUrl}
                title={`${title} Trailer`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

MovieDetailsHero.displayName = 'MovieDetailsHero';
export default MovieDetailsHero;
