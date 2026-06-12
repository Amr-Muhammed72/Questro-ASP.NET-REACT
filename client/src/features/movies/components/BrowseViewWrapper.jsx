import React from 'react';
import { useBrowseData } from '../hooks/useBrowseData';
import BrowseView from './BrowseView';

const BrowseViewWrapper = ({ onGenreSearch }) => {
  const {
    trending,
    recentlyAdded,
    recommended,
    genresWithMovies,
    isLoadingMore
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
      {isLoadingMore && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
    </>
  );
};

export default BrowseViewWrapper;
