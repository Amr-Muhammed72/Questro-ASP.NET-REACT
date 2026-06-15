import React from 'react';
import { useBrowseData } from '../hooks/useBrowseData';
import BrowseView from './BrowseView';

const BrowseViewWrapper = ({ onGenreSearch }) => {
  const {
    trending,
    recentlyAdded,
    recommended,
    genresWithMovies,
    isLoadingMore,
    sentinelRef,   // ← attach to a sentinel div so IntersectionObserver works
  } = useBrowseData();

  return (
    <>
      <BrowseView
        recentlyAdded={recentlyAdded}
        trending={trending}
        recommended={recommended}
        genresWithMovies={genresWithMovies}
        onGenreSearch={({ genreId }) => onGenreSearch(genreId)}
      />

      {/* Sentinel node — watched by IntersectionObserver to trigger next genre chunk */}
      <div ref={sentinelRef} className="h-1" />

      {isLoadingMore && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" />
        </div>
      )}
    </>
  );
};

export default BrowseViewWrapper;
