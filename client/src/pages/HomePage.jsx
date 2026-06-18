import React from 'react';

import HeroSectionHomePage from '../components/sections/HeroSectionHomePage';
import EditorialPosterGrid from '../components/sections/EditorialPosterGrid';
import FeatureStrip from '../components/sections/FeatureStrip';
import { useAuth } from '../features/auth/store/AuthContext';
import { useHomeMedia } from '../hooks/useHomeMedia';
const HomePage = () => {
  const { isLoggedIn } = useAuth();
  const { trendingMedia, recentlyAddedMedia, isLoading } = useHomeMedia();

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden font-sans">
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="relative z-50">
        
      </div>

      <main className="relative z-10">
        <HeroSectionHomePage isLoading={isLoading} isLoggedIn={isLoggedIn} />

        {!isLoading && trendingMedia.length > 0 && (
          <EditorialPosterGrid 
            items={trendingMedia} 
            label="Hot Right Now" 
            title="Don't Miss These Hits"
          />
         )}

        <FeatureStrip />

        {!isLoading && recentlyAddedMedia.length > 0 && (
          <EditorialPosterGrid 
            items={recentlyAddedMedia} 
            label="Just Added" 
            title="Discover New Gems" 
          />
        )}
      </main>
    </div>
  );
};
export default HomePage;
