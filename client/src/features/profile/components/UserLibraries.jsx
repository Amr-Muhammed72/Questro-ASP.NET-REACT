import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Gamepad2, Film, Search, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MovieGrid from '../../../features/movies/components/MovieGrid';
import GameGrid from '../../../features/games/components/GameGrid';
import {
  getMovieWatchlist,
  getMovieLiked,
  getMovieRated,
  getMovieWatched,
  getGameWishlist,
  getGameLiked,
  getGameRated,
  removeMovieFromWatchlist,
  removeMovieFromLiked,
  removeMovieFromRated,
  removeMovieFromWatched,
  removeGameFromWishlist,
  removeGameFromLiked,
  removeGameFromRated,
} from '../api/profileService';

const TABS = [
  { id: 'movie-watchlist', label: 'Movie Watchlist', type: 'movie', action: 'watchlist' },
  { id: 'movie-liked',     label: 'Movie Liked',     type: 'movie', action: 'liked'     },
  { id: 'movie-rated',     label: 'Movie Rated',     type: 'movie', action: 'rated'     },
  { id: 'movie-watched',   label: 'Watched',          type: 'movie', action: 'watched'  },
  { id: 'game-wishlist',  label: 'Game Wishlist',    type: 'game',  action: 'wishlist'  },
  { id: 'game-liked',     label: 'Game Liked',       type: 'game',  action: 'liked'     },
  { id: 'game-rated',     label: 'Game Rated',       type: 'game',  action: 'rated'     },
];

/** Look up the correct service method for the active tab */
const getLibraryFetcher = (tab) => {
  if (!tab) return null;
  const map = {
    'movie-watchlist': getMovieWatchlist,
    'movie-liked':     getMovieLiked,
    'movie-rated':     getMovieRated,
    'movie-watched':   getMovieWatched,
    'game-wishlist':   getGameWishlist,
    'game-liked':      getGameLiked,
    'game-rated':      getGameRated,
  };
  return map[tab.id] ?? null;
};

const UserLibraries = memo(({ userId, isOwnProfile = false, activeTab: initialTab = 'movie-watchlist', onTabChange }) => {
  const [activeTab,  setActiveTab]  = useState(initialTab);
  const [items,      setItems]      = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState(null);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize:   18,
    totalCount: 0,
    totalPages: 1,
  });

  // Keep activeTab in sync with the prop (driven by URL ?tab= param)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ── Pagination/filtering bug fix ───────────────────────────────────────────
  //
  // Root cause of the infinite loop:
  //   fetchLibraryItems was inside useCallback([..., pagination.pageNumber])
  //   → calling setPagination() inside it created a new pagination object
  //   → new pagination → new fetchLibraryItems reference
  //   → useEffect([fetchLibraryItems]) re-ran → infinite loop.
  //
  // Root cause of the stale-closure bug on tab switch:
  //   fetchLibraryItems captured the old pageNumber at call time, so the
  //   first fetch after a tab click ran with the wrong page.
  //
  // Fix: store the "current page" in a ref so fetchLibraryItems is stable
  // (no dependency on pagination state), and drive re-fetches explicitly
  // via an [activeTab, currentPage] trigger effect instead.

  const currentPageRef = useRef(1);

  // Reset page to 1 whenever the tab changes
  useEffect(() => {
    currentPageRef.current = 1;
    setPagination(prev => ({ ...prev, pageNumber: 1 }));
  }, [activeTab]);

  // ── Stable fetch function ──────────────────────────────────────────────────
  // Depends only on userId (stable across the component's lifetime).
  // Reads currentPageRef.current at call-time, so it always sees the freshest
  // page without needing it as a dep (which would trigger recreation).
  const fetchLibraryItems = useCallback(async (tabId, page) => {
    const tab = TABS.find(t => t.id === tabId);
    const fetcher = getLibraryFetcher(tab);
    if (!fetcher) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetcher(userId, page, 18);

      const rawItems = data.data || [];
      const itemsList = rawItems.slice(0, 18);

      if (itemsList.length === 0 && page > 1) {
        currentPageRef.current = 1;
        setPagination(prev => ({ ...prev, pageNumber: 1 }));
        fetchLibraryItems(tabId, 1);
        return;
      }

      setItems(itemsList);
      setPagination({
        pageNumber: data.pageNumber  ?? page,
        pageSize:   18,
        totalCount: data.totalCount  ?? 0,
        totalPages: data.totalPages  ?? 1,
      });
    } catch (err) {
      let errorMessage = err.message;
      if (err.response?.status === 403) errorMessage = "This user's history is private";
      if (err.response?.status === 404) errorMessage = 'User not found';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // only recreated if userId changes

  // ── Trigger: run when tab or page changes ──────────────────────────────────
  // We pass tab + page as explicit arguments so the callback above is stable.
  useEffect(() => {
    fetchLibraryItems(activeTab, currentPageRef.current);
  }, [activeTab, fetchLibraryItems]);
  // Note: currentPageRef.current changes are handled by handlePageChange below,
  // which explicitly calls fetchLibraryItems — so we don't need it in deps.

  // ── Listen for custom global events to optimistically remove toggled items ──
  useEffect(() => {
    const handleLibraryToggle = (e) => {
      const { type, id, action } = e.detail;
      const currentTab = TABS.find(t => t.id === activeTab);
      // Only remove the item if the current tab matches the action that was toggled
      // e.g. activeTab="movie-liked", type="movie", action="liked"
      if (currentTab?.type === type && currentTab?.action === action) {
        const idField = type === 'movie' ? 'tmdbId' : 'rawgId';
        setItems(prev => prev.filter(item => item[idField] !== id));
      }
    };
    window.addEventListener('library-item-toggled', handleLibraryToggle);
    return () => window.removeEventListener('library-item-toggled', handleLibraryToggle);
  }, [activeTab]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTabChange = (tabId) => {
    // currentPageRef reset is handled by the useEffect([activeTab]) above
    setActiveTab(tabId);
    setItems([]);
    if (onTabChange) onTabChange(tabId);
  };

  const handlePageChange = (newPage) => {
    currentPageRef.current = newPage;
    setPagination(prev => ({ ...prev, pageNumber: newPage }));
    fetchLibraryItems(activeTab, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveItem = async (itemId) => {
    const tab = TABS.find(t => t.id === activeTab);
    const removeMap = {
      'movie-watchlist': removeMovieFromWatchlist,
      'movie-liked':     removeMovieFromLiked,
      'movie-rated':     removeMovieFromRated,
      'movie-watched':   removeMovieFromWatched,
      'game-wishlist':   removeGameFromWishlist,
      'game-liked':      removeGameFromLiked,
      'game-rated':      removeGameFromRated,
    };
    const remover = removeMap[tab?.id];
    if (!remover) return;

    try {
      await remover(itemId);
      const idField = tab.type === 'movie' ? 'tmdbId' : 'rawgId';
      setItems(prev => prev.filter(item => item[idField] !== itemId));
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError('Failed to remove item from collection');
    }
  };

  const currentTab  = TABS.find(t => t.id === activeTab);
  const isMovieTab  = currentTab?.type === 'movie';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Section Title + Tabs */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">My Collections</h2>
        <div className="flex flex-wrap items-center gap-6 border-b border-white/5">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative pb-4 text-sm font-semibold transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full"
        >
          {error ? (
            <div className="text-center py-16">
              {error === "This user's history is private" ? (
                <p className="text-zinc-400 text-lg">This user&apos;s history is private</p>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-400 mb-2 font-medium text-lg">Failed to load library</p>
                  <p className="text-zinc-400 text-sm">{error}</p>
                </>
              )}
            </div>
          ) : (isLoading || items.length > 0) ? (
            <>
              {isMovieTab ? (
                <MovieGrid
                  movies={items}
                  loading={isLoading}
                  isOwnProfile={isOwnProfile}
                  onRemoveItem={activeTab === 'movie-rated' ? undefined : handleRemoveItem}
                  currentPage={pagination.pageNumber}
                  onPageChange={handlePageChange}
                />
              ) : (
                <GameGrid
                  games={items}
                  loading={isLoading}
                  isOwnProfile={isOwnProfile}
                  onRemoveItem={activeTab === 'game-rated' ? undefined : handleRemoveItem}
                  currentPage={pagination.pageNumber}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            isOwnProfile ? (
              <div className="py-16">
                <div className="bg-gradient-to-br from-zinc-900/80 via-purple-900/20 to-zinc-900/80 backdrop-blur-sm border border-zinc-700/40 rounded-2xl p-8 md:p-16">
                  <div className="flex flex-col items-center text-center space-y-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-indigo-600/30 rounded-full blur-3xl" />
                      <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        {isMovieTab ? (
                          <Film className="w-10 h-10 text-white" />
                        ) : (
                          <Gamepad2 className="w-10 h-10 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        Start exploring {isMovieTab ? 'movies' : 'games'}!
                      </h3>
                      <p className="text-zinc-400 max-w-xl text-base">
                        {isMovieTab
                          ? 'Add movies to your collections, rate them, and organize your viewing experience.'
                          : 'Build your collection, track games you want to play, and share your gaming journey.'}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center pt-4">
                      <Link
                        to={isMovieTab ? '/movies' : '/games'}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60"
                      >
                        <Search className="w-4 h-4" />
                        Discover {isMovieTab ? 'Movies' : 'Games'}
                      </Link>
                      <Link
                        to={isMovieTab ? '/games' : '/movies'}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-600/50 hover:border-indigo-500/50 text-zinc-100 font-semibold rounded-xl transition-all duration-200"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isMovieTab ? 'Explore Games' : 'Explore Movies'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-zinc-400 text-lg">
                  This user hasn&apos;t added any {isMovieTab ? 'movies' : 'games'} yet
                </p>
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

UserLibraries.displayName = 'UserLibraries';
export default UserLibraries;
