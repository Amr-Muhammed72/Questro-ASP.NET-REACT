import React from "react";
import { Star } from "lucide-react";

export default function MovieHeroSection() {
  // Example API data
  const movie = {
    title: "Interstellar",
    rating: 8.6,
    trailerKey: "zSWdZVtXT7E", // YouTube video key from TMDB API
  };

  return (
    <section className="relative w-full h-[80vh] overflow-hidden rounded-3xl">
      {/* Trailer */}
      <iframe
        className="absolute inset-0 w-full h-full object-cover"
        src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${movie.trailerKey}`}
        title={movie.title}
        allow="autoplay; encrypted-media"
        allowFullScreen
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full p-8 md:p-12">
        
        {/* Top Row */}
        <div className="flex items-start justify-between">
          
          {/* Movie Name */}
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
              {movie.title}
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-semibold text-lg">
              {movie.rating}
            </span>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="max-w-2xl">
          <p className="text-gray-200 text-lg md:text-xl">
            A team of explorers travel through a wormhole in space in an
            attempt to ensure humanity's survival.
          </p>

          <div className="flex gap-4 mt-6">
            <button className="bg-red-600 hover:bg-red-700 transition px-6 py-3 rounded-xl text-white font-semibold">
              Watch Now
            </button>

            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md transition px-6 py-3 rounded-xl text-white font-semibold border border-white/20">
              Add to Watchlist
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}