import React, { memo } from 'react';
import GameGrid from './GameGrid';
const SearchView = memo(({ games, loading, error, currentPage, totalPages, onPageChange }) => (
  <GameGrid
    games={games}
    loading={loading}
    error={error}
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={onPageChange}
  />
));

SearchView.displayName = 'SearchView';
export default SearchView;