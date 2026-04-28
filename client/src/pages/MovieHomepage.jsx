import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import MovieRow from '../components/sections/MovieRow';
import HeroBanner from '../components/sections/HeroBanner';
import bgImage from '../assets/main-background.png';
import { getFeaturedMovie, getTrendingMovies, getContinueWatching, getTop10Movies } from '../services/movieApi';
      
export default function MovieHomepage() {
  const [featured, setFeatured] = useState(null);
  const [trending, setTrending] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [top10, setTop10] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const featureData = await getFeaturedMovie();
      const trendingData = await getTrendingMovies();
      const continueData = await getContinueWatching();
      const top10Data = await getTop10Movies();
      
      setFeatured(featureData);
      setTrending(trendingData);
      setContinueWatching(continueData);
      setTop10(top10Data);
    };
    
    loadData();
  }, []);
//   background as you know 
  const backgroundStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    };
  return (
    <div className="relative min-h-screen bg-zinc-950 pb-20 font-sans" style={backgroundStyle}> 
    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <NavBar />
      <HeroBanner movie={featured} />
      <div className="relative z-20 space-y-12 mx-auto px-4">
        <MovieRow title="Your Next Watch" movies={trending} isLandscape={false} />
        <MovieRow title="Top 10 Movies Today" movies={top10} isTop10={true} />
        <MovieRow title="Crowd Pleasers" movies={trending} isLandscape={false} />
        <MovieRow title="Continue Watching" movies={continueWatching} isLandscape={true} />
      </div>
    </div>
  );
}