import { memo, useState, useEffect } from 'react';
import { Loader, Sparkles, Gamepad2, Film, Search, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieGrid from '../../../features/movies/components/MovieGrid';
import {
  getMovieWatchlist,
  getMovieLiked,
  getMovieRated,
  getMovieWatched,
  getGameWishlist,
  getGameLiked,
  getGameRated
} from '../api/profileService';

const TABS = [
  { id: 'movie-watchlist', label: 'Movie Watchlist', type: 'movie', action: 'watchlist' },
  { id: 'movie-liked', label: 'Movie Liked', type: 'movie', action: 'liked' },
  { id: 'movie-rated', label: 'Movie Rated', type: 'movie', action: 'rated' },
  { id: 'movie-watched', label: 'Watched', type: 'movie', action: 'watched' },
  { id: 'game-wishlist', label: 'Game Wishlist', type: 'game', action: 'wishlist' },
  { id: 'game-liked', label: 'Game Liked', type: 'game', action: 'liked' },
  { id: 'game-rated', label: 'Game Rated', type: 'game', action: 'rated' }
];

const UserLibraries = memo(({ userId, username, isOwnProfile = false, activeTab: initialTab = 'movie-watchlist', onTabChange }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ pageNumber: 1, pageSize: 18, totalCount: 0 });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchLibraryItems();
  }, [userId, activeTab]);

  const fetchLibraryItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tab = TABS.find(t => t.id === activeTab);
      const pageIndex = pagination.pageNumber;
      const pageSize = pagination.pageSize;

      let data;
      if (tab.type === 'movie') {
        switch (tab.action) {
          case 'watchlist':
            data = await getMovieWatchlist(userId, pageIndex, pageSize);
            break;
          case 'liked':
            data = await getMovieLiked(userId, pageIndex, pageSize);
            break;
          case 'rated':
            data = await getMovieRated(userId, pageIndex, pageSize);
            break;
          case 'watched':
            data = await getMovieWatched(userId, pageIndex, pageSize);
            break;
        }
      } else {
        switch (tab.action) {
          case 'wishlist':
            data = await getGameWishlist(userId, pageIndex, pageSize);
            break;
          case 'liked':
            data = await getGameLiked(userId, pageIndex, pageSize);
            break;
          case 'rated':
            data = await getGameRated(userId, pageIndex, pageSize);
            break;
        }
      }

      setItems(data.data || []);
      setPagination({
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalCount: data.totalCount,
        totalPages: data.totalPages
      });
    } catch (err) {
      let errorMessage = err.message;
      if (err.response?.status === 403) {
        errorMessage = 'This user\'s history is private';
      } else if (err.response?.status === 404) {
        errorMessage = 'User not found';
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTab = TABS.find(t => t.id === activeTab);
  const isMovieTab = currentTab?.type === 'movie';

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, pageNumber: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">My Collections</h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPagination({ pageNumber: 1, pageSize: 18, totalCount: 0 });
                if (onTabChange) {
                  onTabChange(tab.id);
                }
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800/60 hover:border-indigo-500/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 mb-2 font-medium text-lg">Failed to load library</p>
          <p className="text-zinc-400 text-sm">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : items.length === 0 ? (
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
            <p className="text-zinc-400 text-lg">This user hasn't added any {isMovieTab ? 'movies' : 'games'} yet</p>
          </div>
        )
      ) : (
        <>
          <MovieGrid
            movies={isMovieTab ? items : []}
            games={!isMovieTab ? items : []}
            type={currentTab.type}
            loading={isLoading}
            hasMore={pagination.pageNumber < pagination.totalPages}
            onLoadMore={() => handlePageChange(pagination.pageNumber + 1)}
          />
        </>
      )}
    </div>
  );
});

UserLibraries.displayName = 'UserLibraries';
export default UserLibraries;
