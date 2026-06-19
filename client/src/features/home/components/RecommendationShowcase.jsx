import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Gamepad2, Film } from 'lucide-react';

const RecommendationShowcase = ({ items, isLoading = false }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setScrollRight] = useState(true);

  // We skip the first 2 items (best movie and best game) since the Hero section handles them!
  const movieToSkip = (items || []).find(m => m.type === 'movie');
  const gameToSkip = (items || []).find(m => m.type === 'game');
  
  const carouselItems = (items || []).filter(item => item !== movieToSkip && item !== gameToSkip).map(item => ({
    ...item,
    imageUrl: item.imageUrl || item.originalData?.backdropUrl || item.originalData?.posterUrl || 'https://via.placeholder.com/1280x720?text=No+Image',
    type: item.type || (item.originalData?.rawgId ? 'game' : 'movie'),
    rawgId: item.originalData?.rawgId || item.id?.replace('game-', ''),
    tmdbId: item.originalData?.tmdbId || item.id?.replace('movie-', ''),
    rating: item.rating || item.originalData?.rating || item.originalData?.tmdbRating,
    genres: item.originalData?.genres || item.genres
  }));

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 5);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; 
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    if (carouselItems.length === 0) return;
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [carouselItems.length]);

  if (isLoading) {
    return (
      <section className="relative w-full py-12 overflow-hidden group/section">
        <div className="max-w-7xl mx-auto px-6">
          {/* Skeleton Header */}
          <div className="mb-6">
            <div className="w-48 h-8 bg-white/10 rounded-lg animate-pulse mb-3" />
            <div className="w-64 h-4 bg-white/5 rounded animate-pulse" />
          </div>

          <div className="relative -mx-6 px-6 overflow-hidden">
            <div className="flex gap-4 sm:gap-6 pb-8 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="shrink-0 w-[240px] sm:w-[280px] lg:w-[320px]">
                  <div className="aspect-[16/9] rounded-2xl bg-white/5 animate-pulse mb-4 shadow-lg border border-white/5" />
                  <div>
                    <div className="w-3/4 h-5 bg-white/10 rounded animate-pulse mb-3" />
                    <div className="w-1/2 h-4 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    return (
      <section className="relative w-full py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="w-full p-12 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 backdrop-blur-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <Star className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-300 mb-2">No recommendations yet</h3>
            <p className="text-zinc-500 max-w-md">
              Start rating movies and games, or add items to your wishlist and watchlist to get personalized picks tailored just for you.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (carouselItems.length === 0) return null;

  return (
    <section className="relative w-full py-12 overflow-hidden group/section">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            More For You
          </h3>
          <p className="text-zinc-400 text-sm mt-1">Keep exploring recommendations curated for your taste.</p>
        </div>

        <div className="relative -mx-6 px-6 group/carousel">
          
          {/* LEFT ARROW (Pushed further out) */}
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="absolute -left-2 lg:-left-12 top-[35%] -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/60 hidden md:flex items-center justify-center text-white disabled:opacity-0 disabled:pointer-events-none hover:bg-zinc-800 transition-all backdrop-blur-md border border-white/10 shadow-2xl opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="w-6 h-6 lg:w-8 lg:h-8" />
          </button>

          {/* SCROLL CONTAINER */}
          <motion.div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {carouselItems.map((item, idx) => (
              <motion.div
                key={`${item.type}-${item.id || item.rawgId || item.tmdbId || idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="snap-start shrink-0 w-[240px] sm:w-[280px] lg:w-[320px] group cursor-pointer"
              >
                <Link to={`/${item.type === 'game' ? 'games' : 'movies'}/${item.type === 'game' ? item.rawgId : item.tmdbId}`}>
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-lg mb-4 bg-zinc-900">
                    {/* Blurred Ambient Background */}
                    <img 
                      src={item.imageUrl} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 saturate-150"
                      aria-hidden="true"
                    />
                    {/* Foreground Image - Object Contain prevents cropping of vertical posters */}
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 group-hover:from-black/40 transition-colors duration-300" />
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none" />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase border border-white/10 flex items-center gap-1">
                        {item.type === 'game' ? <Gamepad2 className="w-3 h-3 text-purple-400" /> : <Film className="w-3 h-3 text-blue-400" />}
                        {item.type}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      {item.rating && (
                        <span className="flex items-center gap-1 text-yellow-500 font-bold">
                          <Star className="w-3 h-3 fill-yellow-500" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="truncate">
                        {item.genres?.slice(0, 2).map(g => typeof g === 'string' ? g : g.name).join(' • ')}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* RIGHT ARROW (Pushed further out) */}
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="absolute -right-2 lg:-right-12 top-[35%] -translate-y-1/2 z-20 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-black/60 hidden md:flex items-center justify-center text-white disabled:opacity-0 disabled:pointer-events-none hover:bg-zinc-800 transition-all backdrop-blur-md border border-white/10 shadow-2xl opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8" />
          </button>

        </div>
      </div>
    </section>
  );
};

export default RecommendationShowcase;
