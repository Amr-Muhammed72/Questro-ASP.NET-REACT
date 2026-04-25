import React from 'react';

export default function Top10Card({ movie, rank }) {
  return (
    <div className="relative flex-shrink-0 w-40 sm:w-48 aspect-[2/3] flex items-end">
      {/* Giant Number */}
      <div className="absolute -left-6 -bottom-4 text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-b from-zinc-700 to-zinc-950 leading-none select-none drop-shadow-2xl z-0">
        {rank}
      </div>
      {/* Movie Poster */}
      <div className="relative z-10 w-[85%] ml-auto aspect-[2/3] rounded-md overflow-hidden shadow-2xl transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
        <img src={movie.imageUrl} alt={movie.title} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}