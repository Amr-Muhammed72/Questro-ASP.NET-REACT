import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Gamepad2, Film, Star, Play, Info } from 'lucide-react';

const HeroSectionHomePage = ({ isLoading, displayMedia = [] }) => {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isLoading && displayMedia && displayMedia.length > 0) {
      const movie = displayMedia.find(m => m.type === 'movie');
      const game = displayMedia.find(m => m.type === 'game');
      
      const parsedItems = [];
      
      if (movie) {
        parsedItems.push({
          id: movie.id,
          type: 'movie',
          title: movie.title,
          description: movie.description || movie.originalData?.overview,
          backdropUrl: movie.originalData?.backdropUrl || movie.imageUrl,
          posterUrl: movie.originalData?.posterUrl || movie.imageUrl,
          rating: movie.rating || movie.originalData?.tmdbRating,
          genres: (movie.originalData?.genres || []).map(g => typeof g === 'string' ? g : g.name),
          releaseDate: movie.originalData?.releaseDate,
          linkId: movie.originalData?.tmdbId || movie.id.replace('movie-', '')
        });
      }
      
      if (game) {
        parsedItems.push({
          id: game.id,
          type: 'game',
          title: game.title,
          description: game.description || game.originalData?.description_raw,
          backdropUrl: game.originalData?.background_image || game.imageUrl,
          posterUrl: game.originalData?.posterUrl || game.imageUrl,
          rating: game.rating,
          genres: (game.originalData?.genres || []).map(g => typeof g === 'string' ? g : g.name),
          releaseDate: game.originalData?.releaseDate,
          linkId: game.originalData?.rawgId || game.id.replace('game-', '')
        });
      }

      setItems(parsedItems);
    }
  }, [displayMedia, isLoading]);

  // Auto-rotate if not interacting
  useEffect(() => {
    if (items.length < 2) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current === 0 ? 1 : 0));
    }, 10000);
    return () => clearInterval(interval);
  }, [items.length]);

  // --- Parallax 3D Card Logic ---
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 200 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Rotate based on mouse position
  const rotateX = useTransform(smoothMouseY, [0, 1], [15, -15]);
  const rotateY = useTransform(smoothMouseX, [0, 1], [-15, 15]);
  
  // Glare position based on mouse
  const glareX = useTransform(smoothMouseX, [0, 1], ['-100%', '100%']);
  const glareY = useTransform(smoothMouseY, [0, 1], ['-100%', '100%']);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const activeItem = items[activeIndex];

  // Premium Skeleton Structure matching the real layout
  const LoadingSkeleton = () => (
    <motion.div 
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="absolute inset-0 w-full h-full flex flex-col md:flex-row items-center pt-24 md:pt-0 max-w-[1400px] mx-auto px-6 md:px-12 z-20"
    >
      {/* Background Pulse */}
      <div className="absolute inset-0 -z-10 bg-[#07070a] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/50 via-[#07070a] to-zinc-900/50 animate-pulse" />
      </div>

      {/* MASSIVE BOTTOM FADE TO MELT INTO THE NEXT SECTION (Skeleton version) */}
      <div className="absolute bottom-0 left-0 w-full h-[50vh] z-10 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />

      {/* Left Content Skeleton */}
      <div className="w-full md:w-[55%] pr-0 md:pr-12 flex flex-col justify-center order-2 md:order-1 mt-12 md:mt-0 z-20">
        <div className="w-24 h-8 bg-white/5 rounded-full mb-5 animate-pulse" />
        <div className="w-3/4 h-16 bg-white/10 rounded-lg mb-4 animate-pulse" />
        <div className="w-1/2 h-16 bg-white/10 rounded-lg mb-6 animate-pulse" />
        
        <div className="flex gap-3 mb-8">
          <div className="w-16 h-6 bg-white/5 rounded animate-pulse" />
          <div className="w-32 h-6 bg-white/5 rounded animate-pulse" />
        </div>

        <div className="w-full h-4 bg-white/5 rounded mb-3 animate-pulse" />
        <div className="w-full h-4 bg-white/5 rounded mb-3 animate-pulse" />
        <div className="w-2/3 h-4 bg-white/5 rounded mb-10 animate-pulse" />
        
        <div className="flex gap-4">
          <div className="w-40 h-12 bg-white/10 rounded-full animate-pulse" />
          <div className="w-36 h-12 bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Right Content Skeleton (3D Cards) */}
      <div className="w-full md:w-[45%] flex justify-center md:justify-end items-center h-[400px] md:h-[650px] order-1 md:order-2 z-20">
        <div className="relative w-full max-w-[500px] h-full flex items-center justify-center">
          <div className="absolute rounded-xl overflow-hidden bg-white/5 animate-pulse aspect-[2/3] w-[240px] md:w-[360px] shadow-2xl border border-white/5" style={{ transform: 'rotateY(-25deg)', zIndex: 20 }} />
          <div className="absolute rounded-xl overflow-hidden bg-white/5 animate-pulse aspect-[16/9] w-[320px] md:w-[480px] opacity-40" style={{ transform: 'translateX(120px) translateZ(-300px) scale(0.8) rotateY(-25deg)', zIndex: 10 }} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <section className="relative w-full h-[85vh] min-h-[700px] bg-[#050505] overflow-hidden flex items-center">
      <AnimatePresence mode="wait">
        {(isLoading || items.length === 0) ? (
          <LoadingSkeleton />
        ) : (
          <motion.div 
            key="real-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* 1. BRIGHT, CINEMATIC BACKGROUND (LESS BLUR) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id + '-bg'}
                className="absolute inset-0 z-0 bg-[#050505]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                {/* Reduced to blur-sm (very subtle) to keep it crystal clear but cinematic */}
                <img 
                  src={activeItem.backdropUrl} 
                  alt="" 
                  className="w-full h-full object-cover blur-sm scale-105 opacity-80 saturate-[1.2]"
                />
              </motion.div>
            </AnimatePresence>

            {/* 2. ELEGANT TEXT-PROTECTION GRADIENTS */}
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#050505] via-[#050505]/70 to-transparent w-[80%]" />
            
            {/* MASSIVE BOTTOM FADE TO MELT INTO THE NEXT SECTION */}
            {/* The color EXACTLY matches the HomePage background (#09090b) to eliminate harsh lines */}
            <div className="absolute bottom-0 left-0 w-full h-[50vh] z-10 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 w-full h-full flex flex-col md:flex-row items-center pt-24 md:pt-0">
              
              {/* TEXT CONTENT (LEFT SIDE) */}
              <div className="w-full md:w-[55%] pr-0 md:pr-12 flex flex-col justify-center order-2 md:order-1 mt-12 md:mt-0 z-20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem.id + '-text'}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <span className={`px-3.5 py-1.5 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 border ${
                        activeItem.type === 'movie' ? 'bg-blue-600/30 border-blue-400/30' : 'bg-purple-600/30 border-purple-400/30'
                      }`}>
                        {activeItem.type === 'movie' ? <Film className="w-3.5 h-3.5" /> : <Gamepad2 className="w-3.5 h-3.5" />}
                        {activeItem.type === 'movie' ? 'Movie Match' : 'Game Match'}
                      </span>
                      {activeItem.rating && (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-yellow-400">
                          <Star className="w-4 h-4 fill-yellow-400" />
                          {activeItem.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5 drop-shadow-lg tracking-tight max-w-3xl">
                      {activeItem.title}
                    </h1>

                    <div className="flex items-center gap-2.5 text-zinc-300 text-sm font-medium mb-6 flex-wrap">
                      {activeItem.releaseDate && (
                        <span className="text-white bg-white/10 px-2 py-0.5 rounded border border-white/5">
                          {new Date(activeItem.releaseDate).getFullYear()}
                        </span>
                      )}
                      {activeItem.genres && activeItem.genres.length > 0 && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span>{activeItem.genres.slice(0, 3).join(' • ')}</span>
                        </>
                      )}
                    </div>

                    <p className="text-zinc-300 text-base md:text-lg line-clamp-3 mb-8 max-w-2xl leading-relaxed font-normal">
                      {activeItem.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <Link
                        to={`/${activeItem.type === 'movie' ? 'movies' : 'games'}/${activeItem.linkId}`}
                        className="group flex items-center gap-2.5 px-8 py-3.5 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all shadow-lg hover:-translate-y-0.5"
                      >
                        <Play className="w-4 h-4 fill-current" /> Play Trailer
                      </Link>
                      <Link
                        to={`/${activeItem.type === 'movie' ? 'movies' : 'games'}/${activeItem.linkId}`}
                        className="flex items-center gap-2.5 px-8 py-3.5 bg-zinc-800/60 text-white backdrop-blur-md font-medium rounded-full hover:bg-zinc-700/80 transition-all border border-white/10 hover:border-white/20"
                      >
                        <Info className="w-4 h-4" /> More Info
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* PARALLAX POSTER CARDS (RIGHT SIDE) */}
              <div 
                className="w-full md:w-[45%] flex justify-center md:justify-end items-center relative h-[400px] md:h-[650px] order-1 md:order-2 perspective-[2000px]"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="relative w-full max-w-[500px] h-full flex items-center justify-center transform-style-3d">
                  {items.map((item, index) => {
                    const isActive = index === activeIndex;
                    const isMovie = item.type === 'movie';
                    
                    return (
                      <motion.div
                        key={item.id}
                        onClick={() => setActiveIndex(index)}
                        className={`absolute rounded-xl overflow-hidden cursor-pointer bg-zinc-900 ${
                          isMovie ? 'aspect-[2/3] w-[240px] md:w-[360px]' : 'aspect-[16/9] w-[320px] md:w-[480px]'
                        }`}
                        animate={{
                          x: isActive ? 0 : 120,
                          z: isActive ? 100 : -300,
                          scale: isActive ? 1 : 0.8,
                          opacity: isActive ? 1 : 0.4,
                        }}
                        style={{
                          rotateX: isActive ? rotateX : 0,
                          rotateY: isActive ? rotateY : -25,
                          zIndex: isActive ? 20 : 10,
                          boxShadow: isActive 
                            ? '0 30px 60px -12px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.1)' 
                            : '0 10px 30px rgba(0,0,0,0.8)',
                          border: isActive 
                            ? '1px solid rgba(255,255,255,0.15)'
                            : '1px solid rgba(255,255,255,0.05)',
                        }}
                        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                        whileHover={isActive ? undefined : { scale: 0.85, opacity: 0.8, x: 120, z: -200 }}
                      >
                        <img 
                          src={item.posterUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                        
                        {isActive && (
                          <motion.div 
                            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-60"
                            style={{
                              background: 'radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)',
                              x: glareX,
                              y: glareY,
                              scale: 2
                            }}
                          />
                        )}
                        
                        {!isActive && <div className="absolute inset-0 bg-black/60 pointer-events-none transition-colors" />}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HeroSectionHomePage;