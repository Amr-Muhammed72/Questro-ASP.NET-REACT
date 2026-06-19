import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import movieService from '../../features/movies/api/movieService';
import gameService from '../../features/games/api/gameService';
import { normalizeMovies, normalizeGames } from '../../utils/mediaUtils';

const fetchTrendingImages = async (type) => {
  let rawData;
  let normalized;
  
  if (type === 'movies') {
    rawData = await movieService.getTrendingMovies(20);
    normalized = normalizeMovies(Array.isArray(rawData) ? rawData : rawData?.items || rawData?.data || [], 20);
  } else {
    rawData = await gameService.getTrending({ take: 20 });
    normalized = normalizeGames(Array.isArray(rawData) ? rawData : rawData?.items || rawData?.data || [], 20);
  }
  
  const allImages = [];
  normalized.forEach(item => {
    // We want high quality backdrops, not vertical posters
    // Usually, backdropUrls are horizontal.
    if (item.imageUrl && item.imageUrl.length > 5 && !allImages.includes(item.imageUrl)) {
      allImages.push(item.imageUrl);
    }
  });
  
  if (allImages.length === 0) {
    throw new Error("No images found");
  }
  return allImages.sort(() => 0.5 - Math.random());
};

const HeroBackground = ({ type }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: images, isLoading } = useQuery({
    queryKey: [`hero-background-${type}`],
    queryFn: () => fetchTrendingImages(type),
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!images || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 8000); // switch every 8 seconds
    
    return () => clearInterval(interval);
  }, [images]);

  if (isLoading || !images || images.length === 0) {
    return (
      <div className="absolute inset-0 z-0 bg-black"></div>
    );
  }

  const currentImageUrl = images[currentIndex];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#09090b] pointer-events-none">
      <AnimatePresence>
        <motion.img
          key={currentImageUrl}
          src={currentImageUrl}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover object-center"
          alt="Hero Background"
        />
      </AnimatePresence>
      
      {/* Gradient Overlays to blend with the rest of the page */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/50 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/60 via-transparent to-[#09090b]/60"></div>
    </div>
  );
};

export default HeroBackground;
