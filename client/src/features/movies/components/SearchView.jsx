import React, { memo } from 'react';
import MovieGrid from './MovieGrid';

const SearchView = memo(({ movies, loading, hasMore, error, loadMore }) => {
  if (loading && movies.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <MovieGrid
      movies={movies}
      loading={loading}
      hasMore={hasMore}
      onLoadMore={loadMore}
      error={error}
    />
  );
});

export default SearchView;
