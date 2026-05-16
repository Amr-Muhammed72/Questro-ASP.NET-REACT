import React, { memo } from 'react';
import GameCard from './GameCard';

const GameGrid = memo(({ games, loading, hasMore, onLoadMore, error }) => {
  return (
    <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
      {/* Grid container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 w-full">
        {/* We use rawgId as the primary identifier key as per the documentation */}
        {games?.map((game) => (
          <GameCard key={game.rawgId} game={game} />
        ))}
      </div>

      {/* Empty State */}
      {!loading && games?.length === 0 && !error && (
        <div className="w-full text-center py-12 text-zinc-400 font-medium">
          No games found. Try adjusting your filters.
        </div>
      )}

      {/* Load More Section */}
      <div className="w-full flex justify-center mt-12 mb-4">
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-300"></div>
          </div>
        ) : hasMore ? (
          <button
            onClick={onLoadMore}
            className="px-6 py-2 rounded-full border border-zinc-600 bg-zinc-800/40 text-zinc-300 hover:bg-zinc-700/60 hover:text-white transition-colors cursor-pointer backdrop-blur-sm"
          >
            Load More Options
          </button>
        ) : games?.length > 0 ? (
          <div className="text-zinc-500 text-sm font-medium">You've reached the end of the list.</div>
        ) : null}
      </div>
    </div>
  );
});

export default GameGrid;