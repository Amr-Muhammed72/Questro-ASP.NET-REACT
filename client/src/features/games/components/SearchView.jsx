import React, { memo } from 'react';
import MovieGrid from '../../../features/movies/components/MovieGrid';

const SearchView = memo(({ games, loading, hasMore, error, loadMore }) => {
  if (loading && games?.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <MovieGrid
      games={games}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={loadMore}
      error={error}
      type="game"
    />
  );
});

export default SearchView;