import React, { useState, useEffect } from 'react';
import { X, FilterX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGenres as getMovieGenres } from '../../features/movies/api/movieService';
import { gameService } from '../../features/games/api/gameService';

export const ActiveFiltersBar = ({ searchParams, setSearchParams, mode = 'movies' }) => {
  const [genreMap, setGenreMap] = useState({});
  const [platformMap, setPlatformMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    
    const fetchMaps = async () => {
      try {
        if (mode === 'movies') {
          const data = await getMovieGenres();
          const list = Array.isArray(data) ? data : (data.data || []);
          const map = {};
          list.forEach(g => map[String(g.genreId || g.id)] = g.name);
          if (isMounted) setGenreMap(map);
        } else if (mode === 'games') {
          const [genreData, platformData] = await Promise.all([
            gameService.getGenres(),
            gameService.getPlatforms()
          ]);
          
          const gList = Array.isArray(genreData) ? genreData : (genreData.data || []);
          const gMap = {};
          gList.forEach(g => gMap[String(g.genreId || g.id)] = g.name);
          
          const pList = Array.isArray(platformData) ? platformData : (platformData.data || []);
          const pMap = {};
          pList.forEach(p => pMap[String(p.platformId || p.id)] = p.name);
          
          if (isMounted) {
            setGenreMap(gMap);
            setPlatformMap(pMap);
          }
        }
      } catch (err) {
        console.error('Failed to load filter maps in ActiveFiltersBar', err);
      }
    };
    
    fetchMaps();
    
    return () => { isMounted = false; };
  }, [mode]);

  const activeFilters = [];
  
  for (const [key, value] of searchParams.entries()) {
    if (key === 'search' || key === 'tab' || key === 'list') continue;
    if (!value) continue;
    
    let label = key.charAt(0).toUpperCase() + key.slice(1);
    let displayValue = value;
    
    if (key === 'genreId') {
      label = 'Genre';
      if (genreMap[value]) displayValue = genreMap[value];
    }
    if (key === 'platformId') {
      label = 'Platform';
      if (platformMap[value]) displayValue = platformMap[value];
    }
    if (key === 'minRating') label = 'Min Rating';
    if (key === 'maxRating') label = 'Max Rating';
    if (key === 'sort') {
      label = 'Sort';
      displayValue = value.replace('.desc', '').replace('.asc', '').replace('_', ' ');
    }
    
    activeFilters.push({ key, label, value: displayValue });
  }

  if (activeFilters.length === 0) return null;

  const removeFilter = (key) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete(key);
      return next;
    });
  };

  const clearAll = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      activeFilters.forEach(f => next.delete(f.key));
      return next;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex flex-wrap items-center gap-2 mt-4 justify-center"
    >
      <span className="text-sm font-semibold text-zinc-400 mr-2 flex items-center gap-1.5">
        <FilterX className="w-4 h-4" />
        Active Filters:
      </span>
      <AnimatePresence>
        {activeFilters.map(filter => (
          <motion.span 
            key={filter.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-200 text-sm font-medium backdrop-blur-md shadow-lg shadow-indigo-500/10"
          >
            <span className="text-zinc-300">{filter.label}:</span> <span className="font-bold text-white capitalize">{filter.value}</span>
            <button 
              onClick={() => removeFilter(filter.key)} 
              className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors text-zinc-400 hover:text-white"
              aria-label={`Remove ${filter.label} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      
      <button 
        onClick={clearAll} 
        className="ml-2 px-3 py-1 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-all"
      >
        Clear All
      </button>
    </motion.div>
  );
};
