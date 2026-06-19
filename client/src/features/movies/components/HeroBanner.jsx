import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info } from 'lucide-react';

export default function HeroBanner({ movie }) {
  const navigate = useNavigate();
  if (!movie) return <div className="w-full h-[85vh] min-h-[600px] bg-zinc-900 animate-pulse mb-12" />;

  const displayImage = movie.backdropUrl || movie.imageUrl || movie.posterUrl;

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] mb-12 overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${displayImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent"></div>
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-end pb-32 px-4 sm:px-8 lg:px-16 max-w-4xl">
        
        <h1 className="text-5xl sm:text-7xl font-extrabold text-white mb-4 drop-shadow-2xl tracking-tight">
          {movie.title}
        </h1>
        
        <div className="flex items-center gap-4 text-zinc-300 font-medium text-sm mb-5">
           <span className="text-green-500 font-bold">98% Match</span>
           <span>2026</span>
           <span className="border border-zinc-600 px-1 py-0.5 rounded text-xs">PG-13</span>
           <span>2h 14m</span>
           <span className="border border-zinc-600 px-1 py-0.5 rounded text-xs">HD</span>
        </div>

        <p className="text-zinc-200 text-base sm:text-lg mb-8 line-clamp-3 drop-shadow-md leading-relaxed">
          {movie.description || "An epic adventure awaits in a breathtaking new world. Forced to navigate a dangerous landscape, our heroes must confront their darkest fears to save their kind from total annihilation."}
        </p>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-white text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-[4px] font-bold text-base sm:text-lg hover:bg-zinc-300 transition-colors shadow-lg">
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> Play
          </button>
          <button 
            onClick={() => navigate(`/movies/${movie.tmdbId || movie.id}`)}
            className="flex items-center gap-2 bg-zinc-600/60 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-[4px] font-bold text-base sm:text-lg hover:bg-zinc-600/80 transition-colors backdrop-blur-sm shadow-lg"
          >
            <Info className="w-5 h-5 sm:w-6 sm:h-6" /> More Info
          </button>
        </div>

      </div>
    </section>
  );
}