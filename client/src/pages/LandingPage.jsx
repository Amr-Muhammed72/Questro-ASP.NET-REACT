import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../features/auth/store/AuthContext';
import { Gamepad2, Film, Shield, ChevronRight, Star } from 'lucide-react';
import { useHomeMedia } from '../features/home/hooks/useHomeMedia';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { trendingMedia, isLoading } = useHomeMedia();
  const [displayMedia, setDisplayMedia] = useState([]);

  useEffect(() => {
    if (!isLoading && trendingMedia && trendingMedia.length >= 3 && displayMedia.length === 0) {
      const movies = trendingMedia.filter(m => m.type === 'movie').slice(0, 3);
      const games = trendingMedia.filter(m => m.type === 'game').slice(0, 3);
      
      const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());
      
      const selectedMovies = shuffle(movies).slice(0, 2);
      const selectedGames = shuffle(games).slice(0, 1);
      
      const combined = shuffle([...selectedMovies, ...selectedGames]);
      
      if (combined.length < 3) {
         setDisplayMedia(trendingMedia.slice(0, 3));
      } else {
         setDisplayMedia(combined);
      }
    }
  }, [trendingMedia, isLoading, displayMedia.length]);

  const handleCTA = () => {
    if (isLoggedIn) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-sans bg-[#09090b] text-zinc-100 flex items-center justify-center">
      {/* Background Starfield */}
      <div className="star-field">
        <div className="star-layer" id="stars-small"></div>
        <div className="star-layer" id="stars-medium"></div>
        <div className="star-layer" id="stars-large"></div>
      </div>
      
      {/* Dynamic Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none opacity-60 mix-blend-screen" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />

      <main className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 w-full max-w-7xl mx-auto">
          
          {/* Left Column - Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left pt-16 lg:pt-0"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glassmorphism mb-6 text-sm font-medium text-indigo-300 ring-1 ring-indigo-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              The Next Evolution of Entertainment
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-6 leading-[1.1]">
              Unlock Your <br />
              <span className="gradient-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm">
                Digital Universe.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              Master your media. Discover, track, and curate your ultimate library of movies and games in one seamless, breathtaking experience.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-zinc-950 font-bold rounded-full overflow-hidden transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2 text-lg sm:text-xl">
                {isLoggedIn ? 'Enter Dashboard' : 'Start Your Journey'}
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 via-white to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.button>
          </motion.div>

          {/* Right Column - Cinematic Collage */}
          <div className="flex-1 relative hidden lg:flex items-center justify-center h-[600px] w-full max-w-lg" style={{ perspective: "2000px" }}>
            {/* Glow behind the stack */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-[100px] pointer-events-none" />

            <AnimatePresence mode="wait">
              {isLoading || displayMedia.length < 3 ? (
                <motion.div 
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                >
                  <div className="absolute bottom-[5%] left-[-5%] w-[200px] h-[300px] rounded-2xl bg-white/5 border border-white/10 z-10 transform -rotate-12 animate-pulse" />
                  <div className="absolute top-[0%] right-[-5%] w-[220px] h-[320px] rounded-2xl bg-white/5 border border-white/10 z-20 transform rotate-6 animate-pulse" />
                  <div className="relative z-30 w-[300px] h-[450px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, rotateY: 20, rotateX: 10, scale: 0.9 }}
                  animate={{ opacity: 1, rotateY: -15, rotateX: 5, scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                >
                  {/* Bottom-left: Anime/Series Poster */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[5%] left-[-5%] w-[200px] h-[300px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-10 glassmorphism transform -rotate-12"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    <img src={displayMedia[0].imageUrl} alt={displayMedia[0].title} className="w-full h-full object-cover" />
                  </motion.div>

                  {/* Top-right: Popular Game/Movie Cover */}
                  <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-[0%] right-[-5%] w-[220px] h-[320px] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-20 glassmorphism transform rotate-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    <img src={displayMedia[1].imageUrl} alt={displayMedia[1].title} className="w-full h-full object-cover" />
                    
                    {/* Floating Badge */}
                    <div className="absolute top-4 right-4 z-20 glassmorphism px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 shadow-lg flex items-center gap-1 backdrop-blur-md">
                      {displayMedia[1].type === 'game' ? <Gamepad2 className="w-3 h-3 text-purple-400" /> : <Film className="w-3 h-3 text-purple-400" />} Trending
                    </div>
                  </motion.div>

                  {/* Main Center: Cinematic Movie Poster */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-30 w-[300px] h-[450px] rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.7)] border border-white/20 glassmorphism"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 opacity-80" />
                    <img src={displayMedia[2].imageUrl} alt={displayMedia[2].title} className="w-full h-full object-cover" />
                    
                    {/* Overlay Content */}
                    <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 rounded bg-indigo-500/80 backdrop-blur-md text-xs font-bold text-white">#1 TRENDING</span>
                        <span className="px-2 py-1 rounded bg-black/50 backdrop-blur-md text-xs font-medium text-zinc-300 uppercase">
                          {displayMedia[2].type}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2 drop-shadow-md truncate" title={displayMedia[2].title}>{displayMedia[2].title}</h3>
                      <div className="flex items-center gap-4 text-sm font-medium text-zinc-300">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {displayMedia[2].rating ? displayMedia[2].rating.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
