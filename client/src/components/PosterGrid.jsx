import React, { useState, useEffect } from 'react';
import mediaService from '../services/media';

const PosterCardDesktop = ({ movie, isLarge }) => (
  <div className={`relative ${isLarge ? 'aspect-[2/3] w-60 shadow-[0_0_40px_rgba(0,0,0,0.8)]' : 'aspect-[2/3] w-48 shadow-2xl'} rounded-xl overflow-hidden bg-zinc-900 cursor-pointer group transition-transform duration-500 hover:scale-110 hover:z-30`}>
    <img 
      src={movie.imageUrl} 
      alt={movie.title} 
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-80"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
      <span className="text-white font-extrabold text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{movie.title}</span>
    </div>
  </div>
);

const PosterCardMobile = ({ movie }) => (
  <div className="relative aspect-[2/3] w-36 sm:w-44 rounded-xl overflow-hidden bg-zinc-900 cursor-pointer shrink-0 snap-center shadow-xl">
    <img 
      src={movie.imageUrl} 
      alt={movie.title} 
      className="w-full h-full object-cover"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
      <span className="text-white font-bold text-xs drop-shadow-md">{movie.title}</span>
    </div>
  </div>
);

const PosterGrid = () => {
  const [trending, setTrending] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        const trendingData = await mediaService.getTrending();
        const releaseData = await mediaService.getNewReleases();
        setTrending(trendingData);
        setNewReleases(releaseData);
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMedia();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full py-32 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      
      {/* 📱 MOBILE VIEW: Netflix-Style Horizontal Scroll */}
      <div className="md:hidden block mt-4 mb-16">
        <div className="px-5 mb-3 flex items-end justify-between">
          <h2 className="text-white text-lg font-bold">Trending Now</h2>
          <span className="text-zinc-400 font-medium text-xs cursor-pointer">See All</span>
        </div>
        
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-5 pb-8 snap-x snap-mandatory">
          {trending.map((movie) => (
            <PosterCardMobile key={`trend-${movie.id}`} movie={movie} />
          ))}
        </div>
        
        <div className="px-5 mb-3 flex items-end justify-between mt-4">
          <h2 className="text-white text-lg font-bold">New Releases</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-5 pb-8 snap-x snap-mandatory">
          {newReleases.map((movie) => (
            <PosterCardMobile key={`new-${movie.id}`} movie={movie} />
          ))}
        </div>
      </div>

      <div className="hidden md:block w-full py-16">
        <div className="max-w-7xl mx-auto px-8 relative pb-20">
          
          <div className="flex flex-wrap items-center justify-center gap-8 relative z-10">
            {trending.slice(0, 5).map((movie, index) => (
              <div 
                key={`desk-trend-${movie.id}`} 
                className={`transform transition-all ${
                  index % 2 !== 0 ? 'translate-y-12' : ''
                } ${index === 2 ? 'scale-110 z-20 mx-6' : 'z-10'}`}
              >
                <PosterCardDesktop movie={movie} isLarge={index === 2} />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-32 relative z-10">
            {trending.slice(5, 10).map((movie, index) => (
              <div 
                key={`desk-trend2-${movie.id}`} 
                className={`transform transition-all ${
                  index % 2 === 0 ? '-translate-y-12' : ''
                }`}
              >
                <PosterCardDesktop movie={movie} />
              </div>
            ))}
          </div>
          
        </div>
      </div>

    </div>
  );
};

export default PosterGrid;