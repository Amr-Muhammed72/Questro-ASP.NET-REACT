import React from 'react';
import useGamesBrowseData from '../hooks/useGamesBrowseData';
import BrowseView from './BrowseView';

const BrowseViewWrapper = ({ onGenreSearch }) => {
  const {
    trending,
    recentlyAdded,
    genresWithGames,
    sentinelRef,
    isLoadingMore
  } = useGamesBrowseData();

  return (
    <>
      <BrowseView
        recentlyAdded={recentlyAdded}
        trending={trending}
        genresWithGames={genresWithGames}
        onGenreSearch={({ genreId }) => onGenreSearch(genreId)}
        sentinelRef={sentinelRef}
      />
      {isLoadingMore && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </>
  );
};

export default BrowseViewWrapper;
