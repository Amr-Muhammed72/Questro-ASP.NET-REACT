import { memo, useCallback, useState, useEffect, useRef } from 'react';
import MovieCard from './MovieCard';
import GameCard from '../../../features/games/components/GameCard';

// ============================================================================
// VISUAL TUTOR DIRECTIVE: LOOKAHEAD CACHE & SLIDING WINDOW PAGINATION
// ============================================================================
// This component demonstrates a modern, highly optimized approach to data fetching:
// 1. Lookahead Cache: Instead of waiting for the user to click "Next", we 
//    silently fetch the data for the upcoming page in the background.
// 2. Instant Swaps: When the user clicks "Next", we swap the UI instantly 
//    using our pre-fetched buffer without hitting the network.
// 3. Dynamic Sliding Window: A UI pattern that handles unknown total pages by
//    relying entirely on the lookahead buffer state, rendering page 1, ellipses,
//    and the current page cluster cleanly.
// ============================================================================

const PAGE_SIZE = 18;

// ── Helpers ────────────────────────────────────────────────────────────────

// Generates the sliding window sequence for UNKNOWN total pages
// e.g. Page 1: [1, 2]
// e.g. Page 2: [1, 2, 3]
// e.g. Page 4: [1, '…', 4, 5]
const buildPageNumbers = (currentPage, hasNextPage) => {
  const result = [];

  if (currentPage === 1) {
    result.push(1);
    if (hasNextPage) result.push(2);
    return result;
  }

  // Always display Page 1
  result.push(1);

  // If currentPage > 2, display an ellipsis to indicate previous pages
  if (currentPage > 2) {
    result.push('…');
  }
  
  // Always display the current page
  result.push(currentPage);

  // If the buffer has data (a next page exists), render currentPage + 1
  if (hasNextPage) {
    result.push(currentPage + 1);
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

// ── Pagination bar ─────────────────────────────────────────────────────────

const PaginationBar = memo(({ currentPage, hasNextPage, onPageChange }) => {
  const pages = buildPageNumbers(currentPage, hasNextPage);
  
  // Logic for disabling Prev/Next buttons (never unmounted)
  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = !hasNextPage;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 mt-10 pt-8 border-t border-zinc-800/60 flex-wrap"
    >
      {/* 
        PREVIOUS BUTTON
        Always visible in DOM. Disabled if on Page 1.
      */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isPrevDisabled}
        aria-label="Previous page"
        className={`
          inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
          transition-all duration-200 border
          ${isPrevDisabled 
            ? 'bg-zinc-900/40 border-zinc-800/50 text-zinc-600 cursor-not-allowed' 
            : 'bg-zinc-900/70 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:border-indigo-500/40 hover:text-white'
          }
        `}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Prev
      </button>

      {/* 
        DYNAMIC SLIDING WINDOW NUMBERS
      */}
      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-zinc-600 select-none">…</span>
        ) : (
          <button
            key={`page-${p}-${idx}`}
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

      {/* 
        NEXT BUTTON
        Always visible in DOM. Disabled if buffer is empty (no next page).
      */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isNextDisabled}
        aria-label="Next page"
        className={`
          inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
          transition-all duration-200 border
          ${isNextDisabled 
            ? 'bg-zinc-900/40 border-zinc-800/50 text-zinc-600 cursor-not-allowed' 
            : 'bg-zinc-900/70 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:border-indigo-500/40 hover:text-white'
          }
        `}
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

const MovieGrid = memo(({
  fetchPage, // async (page) => array of items
  movies,
  games,
  loading      = false,
  error: externalError = null,
  type         = 'movie',
  onRemoveItem,
  isOwnProfile = false,
  currentPage: externalPage  = 1,
  onPageChange: externalPageChange,
  resetKey = 'default'
}) => {
  const CardComponent = type === 'game' ? GameCard : MovieCard;
  const getItemId     = useCallback(
    (item) => (type === 'game' ? item.rawgId : item.tmdbId),
    [type],
  );

  const initialItems = movies || games || [];

  // --- STATE MANAGEMENT ---
  const [currentPage, setCurrentPage] = useState(1);
  const [currentData, setCurrentData] = useState([]);
  
  // The Lookahead Buffer: holds exactly the next page's data to allow instant swaps
  const [nextPageBuffer, setNextPageBuffer] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // We use a fetchIdRef to track the "active" request.
  // This prevents Race Conditions when rapid clicks or fetches resolve out-of-order.
  const fetchIdRef = useRef(0);

  // Fallback for legacy components that don't pass the new fetchPage prop
  useEffect(() => {
    if (!fetchPage) {
       setCurrentData(initialItems);
       setIsLoading(loading);
       setError(externalError);
       setCurrentPage(externalPage);
       setHasNextPage(initialItems.length === PAGE_SIZE);
    }
  }, [initialItems, loading, externalError, externalPage, fetchPage]);

  // --- LOOKAHEAD BUFFERING STRATEGY ---
  // Mount / New Page: Fetch current page, display it, then immediately fire silent bg fetch for next page.
  useEffect(() => {
    if (!fetchPage) return;

    const currentFetchId = ++fetchIdRef.current;
    
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Fetch the initial data blocking the UI with a loading state
        const pageData = await fetchPage(1);
        
        // Race Condition Check: If the user navigated away while fetching, abandon updates.
        if (currentFetchId !== fetchIdRef.current) return;

        setCurrentData(pageData || []);
        setCurrentPage(1);
        
        // Step 2: SILENT BACKGROUND FETCHING
        // Now that the UI has data, immediately fetch the next page in the background
        const nextData = await fetchPage(2);
        
        if (currentFetchId !== fetchIdRef.current) return;

        if (nextData && nextData.length > 0) {
          setNextPageBuffer(nextData);
          setHasNextPage(true);
        } else {
          setNextPageBuffer([]);
          setHasNextPage(false);
        }
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setError(err.message || 'Failed to fetch data');
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

  }, [fetchPage, resetKey]);

  // Handle all explicit page navigations
  const handlePageChange = useCallback(async (newPage) => {
    if (externalPageChange) externalPageChange(newPage);
    if (!fetchPage) return; // Legacy mode delegates to parent

    const currentFetchId = ++fetchIdRef.current;

    if (newPage === currentPage + 1 && nextPageBuffer.length > 0) {
      // --- INSTANT "NEXT" ACTION ---
      // 1. Swap the lookahead buffer's data directly into the current view instantly!
      setCurrentData(nextPageBuffer);
      setCurrentPage(newPage);
      
      // 2. Clear the buffer so we don't accidentally reuse it
      setNextPageBuffer([]);
      const grid = document.getElementById('results-grid');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // 3. Immediately trigger a silent background fetch for the NEW currentPage + 1
      try {
        const nextData = await fetchPage(newPage + 1);
        if (currentFetchId !== fetchIdRef.current) return;

        if (nextData && nextData.length > 0) {
          setNextPageBuffer(nextData);
          setHasNextPage(true);
        } else {
          setNextPageBuffer([]);
          setHasNextPage(false);
        }
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setNextPageBuffer([]);
        setHasNextPage(false);
      }
    } else {
      // --- INSTANT "PREVIOUS" & NUMERICAL ACTIONS ---
      // We don't have a buffer for backward/arbitrary jumps, so we must show a loader.
      setIsLoading(true);
      setError(null);
      
      try {
        // Step 1: Update current page instantly once fetched
        const jumpData = await fetchPage(newPage);
        if (currentFetchId !== fetchIdRef.current) return;

        setCurrentData(jumpData || []);
        setCurrentPage(newPage);
        const grid = document.getElementById('results-grid');
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Step 2: Immediately after update, fire a new silent bg fetch for currentPage + 1
        const lookaheadData = await fetchPage(newPage + 1);
        if (currentFetchId !== fetchIdRef.current) return;

        if (lookaheadData && lookaheadData.length > 0) {
          setNextPageBuffer(lookaheadData);
          setHasNextPage(true);
        } else {
          setNextPageBuffer([]);
          setHasNextPage(false);
        }
      } catch (err) {
        if (currentFetchId !== fetchIdRef.current) return;
        setError(err.message || 'Failed to navigate to page');
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false);
        }
      }
    }
  }, [currentPage, nextPageBuffer, fetchPage, externalPageChange]);

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

  if (isLoading && currentData.length === 0) {
    return (
      <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 w-full">
          {Array.from({ length: 18 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && currentData.length === 0) {
    return (
      <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </div>
          <p className="text-zinc-300 font-semibold text-lg">No {type === 'game' ? 'games' : 'movies'} found matching your filters</p>
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

  return (
    <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16">
      {/* Grid — overlaid with a semi-transparent skeleton during page transitions */}
      <div className="relative">
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 w-full transition-opacity duration-200 ${isLoading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          {currentData.map((item) => (
            <CardComponent
              key={getItemId(item)}
              {...{ [type]: item }}
              onRemove={
                isOwnProfile && onRemoveItem
                  ? () => onRemoveItem(getItemId(item))
                  : undefined
              }
            />
          ))}
        </div>

        {/* Show a loading overlay during arbitrary jumps to simulate the "instant" feeling without losing context */}
        {isLoading && currentData.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl z-10 transition-all">
            <div className="flex flex-col items-center gap-3 bg-zinc-900/90 border border-zinc-700 p-6 rounded-2xl shadow-2xl">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-zinc-300 text-sm font-medium">Fetching page {currentPage}…</span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination bar — always shown when navigable (items exist or past page 1) */}
      {(currentData.length > 0 || currentPage > 1) && (
        <PaginationBar
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
});

MovieGrid.displayName = 'MovieGrid';
export default MovieGrid;