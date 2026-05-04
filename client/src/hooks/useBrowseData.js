import { useState, useEffect } from 'react';
import { getTrendingMovies, getRecentlyAdded, getRecommended, getGenres, discoverMovies } from '../services/movieService';

export const useBrowseData = () => {
  const [trending, setTrending] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [genresWithMovies, setGenresWithMovies] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const results = await Promise.allSettled([
          getTrendingMovies(),
          getRecentlyAdded(),
          getRecommended(),
          getGenres(),
        ]);
        
        if (isMounted) {
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

          const genresList = genresRes?.data || genresRes || [];
          
          const genresWithData = await Promise.all(
            genresList.map(async (genre) => {
              try {
                const res = await discoverMovies({ genreId: genre.genreId }, 1, 18);
                return res && res.data && res.data.length > 0 ? { ...genre, movies: res.data } : null;
              } catch (eror) {
                console.error(`Failed to load movies for genre ${genre.name}`, eror);
                return null;
              }
            })
          );
          
          setGenresWithMovies(genresWithData.filter(Boolean));
        }
      } catch (err) {
        console.error("Failed to load row movies", err);
      }
    };
    
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return { trending, recentlyAdded, recommended, genresWithMovies };
};
