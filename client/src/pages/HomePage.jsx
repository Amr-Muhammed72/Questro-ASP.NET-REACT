import React from 'react';

import HeroSectionHomePage from '../features/home/components/HeroSectionHomePage';
import EditorialPosterGrid from '../features/home/components/EditorialPosterGrid';
import FeatureStrip from '../features/home/components/FeatureStrip';
import RecommendationShowcase from '../features/home/components/RecommendationShowcase';
import { useAuth } from '../features/auth/store/AuthContext';
import { useHomeMedia } from '../features/home/hooks/useHomeMedia';

const HomePage = () => {
  const { isLoggedIn } = useAuth();
  const { trendingMedia, recentlyAddedMedia, recommendedMedia, isLoading, isRecommendationsLoading } = useHomeMedia(isLoggedIn);

  // If logged in, wait for recommendations. Otherwise, wait for public trending.
  const isHeroLoading = isLoggedIn ? isRecommendationsLoading : isLoading;
  
  // Do NOT pass trendingMedia if we are still waiting for recommendations. This prevents the "Toy Story" flash.
  const heroMedia = isLoggedIn 
    ? (isRecommendationsLoading ? [] : (recommendedMedia.length > 0 ? recommendedMedia : trendingMedia))
    : trendingMedia;

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden font-sans bg-[#09090b] text-zinc-100">
      <main className="relative z-10">
        <HeroSectionHomePage isLoading={isHeroLoading} isLoggedIn={isLoggedIn} displayMedia={heroMedia} />

        {/* We use a negative margin (-mt-24 or -mt-32) and relative z-index to pull the next 
            section UP so it overlaps the Hero's bottom gradient fade. This creates the "melting" illusion. */}
        {isLoggedIn && (
          <div className="relative z-30 -mt-8 md:-mt-24 mb-12">
            <RecommendationShowcase items={recommendedMedia} isLoading={isRecommendationsLoading} />
          </div>
        )}

        <div className={`relative z-30 ${(!isLoggedIn || (recommendedMedia.length === 0 && !isRecommendationsLoading)) ? '-mt-8 md:-mt-24' : ''}`}>
          <EditorialPosterGrid 
            items={trendingMedia} 
            label="Hot Right Now" 
            title="Don't Miss These Hits"
            isLoading={isLoading}
          />
        </div>

        <FeatureStrip />

        <EditorialPosterGrid 
          items={recentlyAddedMedia} 
          label="Just Added" 
          title="Discover New Gems" 
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

export default HomePage;
