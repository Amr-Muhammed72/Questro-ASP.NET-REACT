import { memo, useCallback } from 'react';
import GameCard from './GameCard';

// ── Helpers ────────────────────────────────────────────────────────────────

const buildPageNumbers = (currentPage) => {
  const pages = new Set([1]);
  for (let i = currentPage - 2; i <= currentPage + 2; i++) {
    if (i >= 1) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      result.push('…');
    }
  }
  return result;
};

// ── Skeleton card ──────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="flex flex-col items-center w-full animate-pulse">
    <div className="w-full aspect-[2/3] rounded-xl bg-zinc-800/70" />
    <div className="mt-3 h-3 w-3/4 rounded bg-zinc-800/70" />
    <div className="mt-1.5 h-3 w-1/2 rounded bg-zinc-800/70" />
  </div>
);

const PAGE_SIZE = 18;

// ── Pagination bar ─────────────────────────────────────────────────────────

const PaginationBar = memo(({ currentPage, itemsLength, onPageChange }) => {
  const pages = buildPageNumbers(currentPage);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 mt-10 pt-8 border-t border-zinc-800/60 flex-wrap"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="
          inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
          bg-zinc-900/70 border border-zinc-700/50 text-zinc-300
          hover:bg-zinc-800 hover:border-indigo-500/40 hover:text-white
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Prev
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-zinc-600 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`
              min-w-[2.25rem] px-3 py-2 rounded-lg text-sm font-semibold
              border transition-all duration-200
              ${p === currentPage
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/25 scale-105'
                : 'bg-zinc-900/70 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:border-indigo-500/40 hover:text-white'
              }
            `}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={itemsLength === 0}
        aria-label="Next page"
        className="
          inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
          bg-zinc-900/70 border border-zinc-700/50 text-zinc-300
          hover:bg-zinc-800 hover:border-indigo-500/40 hover:text-white
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        Next
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
});

PaginationBar.displayName = 'PaginationBar';

// ── Main component ─────────────────────────────────────────────────────────

const GameGrid = memo(({
  games        = [],
  loading      = false,
  error        = null,
  isOwnProfile = false,
  onRemoveItem,
  currentPage  = 1,
  onPageChange,
}) => {

  const handlePageChange = useCallback((page) => {
    if (!onPageChange) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onPageChange]);

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-red-400 font-semibold">{error}</p>
          <p className="text-zinc-500 text-sm">Try refreshing the page or adjusting your filters.</p>
        </div>
      </div>
    );
  }

  // ── Skeleton grid (initial load) ─────────────────────────────────────────
  if (loading && games.length === 0) {
    return (
      <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 w-full">
          {Array.from({ length: 18 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!loading && games.length === 0) {
    return (
      <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </div>
          <p className="text-zinc-300 font-semibold text-lg">No games found matching your filters</p>
          <p className="text-zinc-500 text-sm max-w-xs">Try adjusting or clearing your filters to see more results.</p>
          {currentPage > 1 && (
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Go Back to Page {currentPage - 1}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Content ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
      <div className="relative">
        {/* Fade existing cards during page transition */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 w-full transition-opacity duration-200 ${loading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          {games.map((game) => (
            <GameCard
              key={game.rawgId}
              game={game}
              onRemove={isOwnProfile && onRemoveItem ? () => onRemoveItem(game.rawgId) : undefined}
            />
          ))}
        </div>

        {/* Spinner overlay during page transitions */}
        {loading && games.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-zinc-400 text-sm font-medium">Loading page {currentPage}…</span>
            </div>
          </div>
        )}
      </div>

      {/* Numbered pagination bar — always shown when navigable */}
      {onPageChange && (games.length > 0 || currentPage > 1) && (
        <PaginationBar
          currentPage={currentPage}
          itemsLength={games.length}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
});

GameGrid.displayName = 'GameGrid';
export default GameGrid;