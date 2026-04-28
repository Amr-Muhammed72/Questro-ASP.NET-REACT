import React from 'react';

const Hero = () => {
  return (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-4 space-y-6 mt-8 md:mt-12 z-20 relative">
      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-xl">
        Igniting Your Passion for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Movies</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Games</span><br className="hidden sm:block" /> Unleashing Wonder!
      </h1>
      
      <p className="text-zinc-300 text-sm sm:text-base md:text-lg max-w-2xl mt-4 mb-6 drop-shadow-md">
        Discover the most trending entertainment right here. From epic blockbuster movies to immersive next-gen gaming experiences, dive into endless fun.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mt-4">
        <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm md:text-base py-3 px-8 rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:-translate-y-0.5">
          Discover Movies
        </button>
        <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-sm md:text-base py-3 px-8 rounded-full transition-all shadow-lg hover:-translate-y-0.5">
          Discover Games
        </button>
      </div>
    </div>
  );
};

export default Hero;