import { memo } from 'react';
import MovieCard from './MovieCard';
import GameCard from '../../../features/games/components/GameCard';

const MovieGrid = memo(({
  movies,
  games,
  loading,
  hasMore,
  onLoadMore,
  error,
  type = 'movie',
  onRemoveItem,
  isOwnProfile = false,
  pagination,
  onPageChange
}) => {
  const items = movies || games;
  const CardComponent = type === 'game' ? GameCard : MovieCard;
  const getItemId = (item) => type === 'game' ? item.rawgId : item.tmdbId;

  return (
    <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 w-full">
        {items?.map((item) => (
          <CardComponent
            key={getItemId(item)}
            {...{[type]: item}}
            onRemove={onRemoveItem ? () => onRemoveItem(getItemId(item)) : undefined}
          />
        ))}
      </div>

      {/* Empty State */}
      {!loading && items?.length === 0 && !error && (
        <div className="w-full text-center py-12 text-zinc-400 font-medium">
          No {type === 'game' ? 'games' : 'movies'} found. Try adjusting your filters.
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8 pt-6 border-t border-zinc-700/50">
          <button
            onClick={() => onPageChange(pagination.pageNumber - 1)}
            disabled={pagination.pageNumber === 1}
            className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:bg-zinc-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all"
          >
            Previous
          </button>
          <span className="text-zinc-400 text-sm">
            Page {pagination.pageNumber} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.pageNumber + 1)}
            disabled={pagination.pageNumber === pagination.totalPages}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
});

export default MovieGrid;