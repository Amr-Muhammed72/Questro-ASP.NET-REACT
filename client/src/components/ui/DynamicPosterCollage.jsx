import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import movieService from '../../features/movies/api/movieService';
import gameService from '../../features/games/api/gameService';
import { normalizeMovies, normalizeGames } from '../../utils/mediaUtils';

const fallbackPosters = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop"
];

const extractData = (res) => Array.isArray(res) ? res : res?.items || res?.data?.data || res?.data || res?.results || [];

const fetchAllPosters = async () => {
  const [moviesRes, gamesRes] = await Promise.all([
    movieService.getTrendingMovies(20),
    gameService.getTrending({ take: 20 })
  ]);

  const rawMovies = extractData(moviesRes);
  const rawGames = extractData(gamesRes);

  const normalizedMovies = normalizeMovies(rawMovies, 20);
  const normalizedGames = normalizeGames(rawGames, 20);

  const allImages = [];
  
  normalizedMovies.forEach(m => {
    // Some backend imageUrls might be partial TMDB paths, but mediaUtils usually handles it.
    // If not, we ensure we only grab valid urls.
    if (m.imageUrl && m.imageUrl.length > 5 && !allImages.includes(m.imageUrl)) {
      allImages.push(m.imageUrl);
    }
  });
  
  normalizedGames.forEach(g => {
    if (g.imageUrl && g.imageUrl.length > 5 && !allImages.includes(g.imageUrl)) {
      allImages.push(g.imageUrl);
    }
  });

  if (allImages.length < 4) {
    throw new Error("Not enough images returned from API");
  }

  // Shuffle the images
  return allImages.sort(() => 0.5 - Math.random());
};

const DynamicPosterCollage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Using React Query for powerful caching, retry logic, and delay handling
  const { data: apiPosters, isLoading, isError } = useQuery({
    queryKey: ['dynamic-collage-posters'],
    queryFn: fetchAllPosters,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 3,                  // Retry 3 times before falling back
    refetchOnWindowFocus: false,
  });

  const displayPosters = isError || !apiPosters ? fallbackPosters : apiPosters;

  useEffect(() => {
    if (isLoading || displayPosters.length < 4) return;
    
    // Smooth transition every 5 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayPosters.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [displayPosters, isLoading]);

  const positions = [
    { y: [0, -15, 0], rotate: [-6, -4, -6], top: '0', left: '0', w: 'w-36', h: 'h-52', shadow: 'shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)]', z: 'z-10', delay: 0 },
    { y: [0, 10, 0], rotate: [4, 6, 4], top: 'top-12', left: 'left-32', w: 'w-48', h: 'h-64', shadow: 'shadow-[0_20px_50px_rgba(147,_51,_234,_0.3)]', z: 'z-20', delay: 1 },
    { y: [0, -10, 0], rotate: [12, 10, 12], top: 'top-[-20px]', left: 'left-[260px]', w: 'w-40', h: 'h-56', shadow: 'shadow-[0_20px_50px_rgba(16,_185,_129,_0.2)]', z: 'z-10', delay: 2 },
    { y: [0, 15, 0], rotate: [-8, -10, -8], top: 'top-44', left: 'left-[200px]', w: 'w-48', h: 'h-48', shadow: 'shadow-[0_20px_50px_rgba(236,_72,_153,_0.2)]', z: 'z-30', delay: 0.5 },
  ];

  return (
    <div className="relative w-full h-[450px] z-10 mt-8 perspective-[1000px]">
      {positions.map((pos, idx) => {
        // Calculate the safe index for each card offset
        const safeIndex = (currentIndex + idx) % displayPosters.length;
        const currentImageUrl = displayPosters[safeIndex];

        return (
          <motion.div 
            key={`frame-${idx}`}
            animate={{ y: pos.y, rotate: pos.rotate }} 
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: pos.delay }}
            style={{ willChange: 'transform' }}
            className={`absolute ${pos.top} ${pos.left} ${pos.w} ${pos.h} rounded-2xl overflow-hidden ${pos.shadow} ${pos.z} border border-white/10 bg-zinc-900`}
          >
            {isLoading ? (
              // High performance animated skeleton loader while API fetches
              <div className="w-full h-full bg-zinc-800 animate-pulse" />
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={currentImageUrl}
                  src={currentImageUrl}
                  initial={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  style={{ willChange: 'opacity, transform, filter' }}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt="Trending Media"
                  loading="lazy"
                />
              </AnimatePresence>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default DynamicPosterCollage;
