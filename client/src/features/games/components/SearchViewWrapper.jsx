import React, { useEffect } from 'react';
import { useGamesDiscovery } from '../hooks/useGamesDiscovery';
import SearchView from './SearchView';

const SearchViewWrapper = ({ filters }) => {
  const {
    games,
    loading: discoveryLoading,
    hasMore,
    error,
    loadMore,
    updateFilters,
  } = useGamesDiscovery();

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
      games={games}
      loading={discoveryLoading}
      hasMore={hasMore}
      error={error}
      loadMore={loadMore}
    />
  );
};

export default SearchViewWrapper;
