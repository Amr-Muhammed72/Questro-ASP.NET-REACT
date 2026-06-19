import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMoviesDiscovery } from '../hooks/useMoviesDiscovery';
import SearchView from './SearchView';

const SearchViewWrapper = () => {
  const [searchParams] = useSearchParams();
  const {
    movies,
    loading,
    error,
    currentPage,
    totalPages,
    updateFilters,
    goToPage,
  } = useMoviesDiscovery();

  const buildFilters = (params) => ({
    search: params.get('search') || null,
    genreId: params.get('genreId') || null,
    language: params.get('language') || null,
    year: params.get('year') || null,
    minRating: params.get('minRating') || null,
    maxRating: params.get('maxRating') || null,
    quality: params.get('quality') || null,
    sort: params.get('sort') || null,
    list: params.get('list') || null,
  });

  useEffect(() => {
    const filters = buildFilters(searchParams);
    updateFilters(filters);
  }, [searchParams, updateFilters]);

  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current === true && loading === false && movies.length > 0) {
      const grid = document.getElementById('results-grid');
      if (grid) {
        // Find the top position of the grid, slightly offset for navbar
        const y = grid.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
    prevLoading.current = loading;
  }, [loading, movies.length]);

  return (
    <SearchView
      movies={movies}
      loading={loading}
      error={error}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={goToPage}
    />
  );
};

export default SearchViewWrapper;
