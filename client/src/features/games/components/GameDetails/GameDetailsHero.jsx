import { memo, useState, useEffect } from 'react';
import { Star, Play, X, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GameDetailsActions from './GameDetailsActions';

const PosterFallback = ({ src, title }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-500">
        <MonitorPlay className="w-12 h-12 mb-2 opacity-50" />
        <span className="text-xs font-bold uppercase tracking-widest opacity-50">No Poster</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${title} Poster`}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

const GameDetailsHero = memo(({ game }) => {
  const {
    title,
    backdropUrl,
    posterUrl,
    releaseDate,
    rating,
    genres,
    trailerUrl,
  } = game;

  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsTrailerOpen(false);
    };
    if (isTrailerOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isTrailerOpen]);

  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

  return (
    <div className="relative w-full min-h-[100svh] bg-[#09090b] flex items-center pt-32 pb-48 lg:pt-40 lg:pb-56 overflow-hidden">
      {/* Background Image & Overlays */}
      <div className="absolute inset-0 overflow-hidden bg-[#09090b]">
        {(backdropUrl || posterUrl) && (
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            src={backdropUrl || posterUrl}
            alt={title}
            className="w-full h-full object-cover object-top filter blur-[2px] opacity-60"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {/* Vibrant color overlays for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-[#09090b]/80 to-purple-900/40 mix-blend-overlay z-10" />
        
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
              if (trailerUrl) setIsTrailerOpen(true);
            }}
            className="w-36 sm:w-48 lg:w-72 xl:w-80 aspect-[2/3] flex-shrink-0 relative z-30 bg-zinc-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group border border-white/10 cursor-pointer"
          >
            <PosterFallback src={posterUrl} title={title} />
            {trailerUrl && typeof trailerUrl === 'string' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-sm">
                <Play className="w-16 h-16 text-white fill-white drop-shadow-2xl" />
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
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 lg:px-4 lg:py-1.5 rounded-lg text-xs lg:text-sm border border-white/10 shadow-sm text-yellow-500 font-bold">
                <Star className="w-4 h-4 fill-yellow-500" />
                {rating ? (rating * 2).toFixed(1) : 'N/A'} <span className="text-zinc-400 text-[10px] lg:text-xs font-normal">/10</span>
              </span>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-10">
              {genres?.map((genre) => (
                <span
                  key={genre.id || genre}
                  className="px-3 py-1 lg:px-4 lg:py-1.5 bg-white/5 border border-white/10 text-zinc-200 rounded-lg text-xs lg:text-sm font-bold tracking-wide shadow-sm hover:bg-white/10 transition-colors"
                >
                  {genre.name || genre}
                </span>
              ))}
            </div>

            {game.platforms && game.platforms.length > 0 && (
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2 mb-10 text-zinc-400">
                <MonitorPlay className="w-5 h-5" />
                {game.platforms.map(p => p.name).join(' • ')}
              </div>
            )}

            <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 w-full sm:w-auto mt-auto">
              {trailerUrl && typeof trailerUrl === 'string' && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center justify-center w-full sm:w-[160px] gap-2 py-3 lg:py-2.5 bg-white text-black text-sm lg:text-base font-black rounded-xl hover:bg-zinc-200 transition-transform shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105 cursor-pointer"
                >
                  <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-black" />
                  Watch Trailer
                </button>
              )}
              {game.storeUrl && (
                <a
                  href={game.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full sm:w-auto px-6 py-3 lg:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
                >
                  Visit Store
                </a>
              )}
              <GameDetailsActions gameId={game.rawgId} />
            </div>
          </motion.div>

        </div>
      </div>

      {/* Trailer Modal Overlay */}
      <AnimatePresence>
        {isTrailerOpen && trailerUrl && typeof trailerUrl === 'string' && (
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
              <video
                className="w-full h-full object-contain"
                src={trailerUrl}
                autoPlay
                controls
                playsInline
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GameDetailsHero.displayName = 'GameDetailsHero';
export default GameDetailsHero;
