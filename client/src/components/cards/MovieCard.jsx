import React from 'react';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';

export default function MovieCard({ movie, isLandscape = false, progress }) {
  const titleClass = isLandscape 
    ? "mt-2 text-sm sm:text-base text-zinc-300 font-medium px-1 truncate w-64 sm:w-72" 
    : "mt-2 text-xs sm:text-sm text-zinc-300 font-bold px-1 truncate w-36 sm:w-44 min-h-[1.25rem] text-center";

  return (
    <div className="flex flex-col group/card cursor-pointer">
      <div className={`relative flex-shrink-0 transition-transform duration-300 ease-out hover:scale-105 hover:z-30 rounded-md overflow-hidden bg-zinc-900 ${isLandscape ? 'w-64 sm:w-72 aspect-video' : 'w-36 sm:w-44 lg:w-48 xl:w-52 aspect-[2/3]'}`}>
        <img src={movie.imageUrl} alt={movie.title} className="w-full h-full object-cover transition-all duration-300" />
        
        {movie.isTop10 && (
          <div className="absolute top-0 right-0 bg-[#e50914] text-white text-[8px] sm:text-[10px] font-black px-1.5 py-1 box-border flex flex-col items-center leading-none rounded-bl-sm z-20">
            <span>TOP</span>
            <span className="text-sm sm:text-base">10</span>
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-center items-center p-3 sm:p-4 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-black/40">
        </div>

        {movie.recentlyAdded && !progress && (
          <div className="absolute bottom-0 w-full flex justify-center pb-2 z-20">
            <div className="bg-[#e50914] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-sm">
              Recently Added
            </div>
          </div>
        )}

      </div>

      <h4 className={titleClass}>
        {movie.title}
      </h4>
    </div>
  );
}