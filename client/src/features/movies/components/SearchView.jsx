import React, { memo } from 'react';
import MovieGrid from './MovieGrid';
const SearchView = memo(({ movies, loading, error, currentPage, totalPages, onPageChange }) => (
  <MovieGrid
    movies={movies}
    loading={loading}
    error={error}
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={onPageChange}
  />
));

SearchView.displayName = 'SearchView';
export default SearchView;
