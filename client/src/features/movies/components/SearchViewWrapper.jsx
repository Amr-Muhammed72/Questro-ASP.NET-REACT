import React, { useEffect } from 'react';
import { useMoviesDiscovery } from '../hooks/useMoviesDiscovery';
import SearchView from './SearchView';

const SearchViewWrapper = ({ filters }) => {
  const {
    movies,
    loading: discoveryLoading,
    hasMore,
    error,
    loadMore,
    updateFilters,
  } = useMoviesDiscovery();

  useEffect(() => {
    updateFilters(filters);
  }, [filters, updateFilters]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center mb-8">
        Oops! Something went wrong: {error}
      </div>
    );
  }

  return (
    <SearchView
      movies={movies}
      loading={discoveryLoading}
      hasMore={hasMore}
      error={error}
      loadMore={loadMore}
    />
  );
};

export default SearchViewWrapper;
