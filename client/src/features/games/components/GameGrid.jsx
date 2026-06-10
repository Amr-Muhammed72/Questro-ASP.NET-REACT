import { memo } from 'react';
import GameCard from './GameCard';

const GameGrid = memo(({ games, loading, hasMore, onLoadMore, error, isOwnProfile = false, onRemoveItem, pagination, onPageChange }) => {
  console.log('Rendering GameGrid with games:', games);
  return (
    <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
      {/* Grid container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 w-full">
        {/* We use rawgId as the primary identifier key as per the documentation */}
        {games?.map((game) => (
          <GameCard
            key={game.rawgId}
            game={game}
            onRemove={isOwnProfile && onRemoveItem ? () => onRemoveItem(game.rawgId) : undefined}
          />
        ))}
      </div>

      {/* Empty State */}
      {!loading && games?.length === 0 && !error && (
        <div className="w-full text-center py-12 text-zinc-400 font-medium">
          No games found. Try adjusting your filters.
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

export default GameGrid;