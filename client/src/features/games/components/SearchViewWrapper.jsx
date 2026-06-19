import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGamesDiscovery } from '../hooks/useGamesDiscovery';
import SearchView from './SearchView';

const SearchViewWrapper = () => {
  const [searchParams] = useSearchParams();
  const {
    games,
    loading,
    error,
    currentPage,
    totalPages,
    updateFilters,
    goToPage,
  } = useGamesDiscovery();

  const buildFilters = (params) => ({
    search: params.get('search') || null,
    genreId: params.get('genreId') || null,
    platformId: params.get('platformId') || null,
    year: params.get('year') || null,
    minRating: params.get('minRating') || null,
    maxRating: params.get('maxRating') || null,
    sort: params.get('sort') || null,
    list: params.get('list') || null,
  });

  useEffect(() => {
    const filters = buildFilters(searchParams);
    updateFilters(filters);
  }, [searchParams, updateFilters]);

  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current === true && loading === false && games.length > 0) {
      const grid = document.getElementById('results-grid');
      if (grid) {
        // Find the top position of the grid, slightly offset for navbar
        const y = grid.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
    prevLoading.current = loading;
  }, [loading, games.length]);

  return (
    <SearchView
      games={games}
      loading={loading}
      error={error}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={goToPage}
    />
  );
};

export default SearchViewWrapper;
