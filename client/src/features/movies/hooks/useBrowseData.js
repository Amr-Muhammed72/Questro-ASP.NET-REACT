import { useState, useEffect, useRef } from 'react';
import { getTrendingMovies, getRecentlyAdded, getRecommended, getGenres, discoverMovies } from '../api/movieService';

export const useBrowseData = () => {
  const [trending, setTrending] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [genresWithMovies, setGenresWithMovies] = useState([]);
  const fetchedGenres = useRef(new Set());

  useEffect(() => {
    let isMounted = true;
    let allGenres = [];
    let currentIndex = 0;
    const CHUNK_SIZE = 3;

    const fetchMoviesForGenres = async (genresChunk) => {
      await Promise.allSettled(
        genresChunk.map(async (genre) => {
          if (fetchedGenres.current.has(genre.genreId)) return;
          fetchedGenres.current.add(genre.genreId);
          try {
            const res = await discoverMovies({ genreId: genre.genreId }, 1, 18);
            if (res && res.data && res.data.length > 0 && isMounted) {
              setGenresWithMovies(prev => {
                if (prev.some(g => g.genreId === genre.genreId)) return prev;
                return [...prev, { ...genre, movies: res.data }];
              });
            }
          } catch (error) {
            console.error(`Failed to load movies for genre ${genre.name}`, error);
          }
        })
      );
    };

    const handleScroll = async () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1500 &&
        currentIndex < allGenres.length
      ) {
        const nextChunk = allGenres.slice(currentIndex, currentIndex + CHUNK_SIZE);
        currentIndex += CHUNK_SIZE;
        currentIndex = Math.min(currentIndex, allGenres.length);
        await fetchMoviesForGenres(nextChunk);
      }
    };

    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          getTrendingMovies(),
          getRecentlyAdded(),
          getRecommended(),
          getGenres(),
        ]);
        
        if (!isMounted) return;

        const trendingData = results[0].status === 'fulfilled' ? results[0].value : null;
        const recentlyData = results[1].status === 'fulfilled' ? results[1].value : null;
        const recommendedData = results[2].status === 'fulfilled' ? results[2].value : null;
        const genresRes = results[3].status === 'fulfilled' ? results[3].value : null;

        if (trendingData?.data) setTrending(trendingData.data);
        else if (Array.isArray(trendingData)) setTrending(trendingData);

        if (recentlyData?.data) setRecentlyAdded(recentlyData.data);
        else if (Array.isArray(recentlyData)) setRecentlyAdded(recentlyData);

        if (recommendedData?.data) setRecommended(recommendedData.data);
        else if (Array.isArray(recommendedData)) setRecommended(recommendedData);

        let genresList = genresRes?.data || genresRes || [];
        
        genresList.sort((a, b) => a.name.localeCompare(b.name));
        allGenres = genresList;
        
        currentIndex = Math.min(4, allGenres.length);
        const initialChunk = allGenres.slice(0, currentIndex);
        await fetchMoviesForGenres(initialChunk);

        window.addEventListener('scroll', handleScroll);

      } catch (err) {
        console.error("Failed to load row movies", err);
      }
    };
    
    loadData();
    return () => {
      isMounted = false;
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { trending, recentlyAdded, recommended, genresWithMovies };
};
