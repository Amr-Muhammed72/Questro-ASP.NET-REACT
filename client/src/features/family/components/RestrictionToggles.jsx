import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import movieService from '../../movies/api/movieService';
import gameService from '../../games/api/gameService';

const movieRatingCaps = ['G', 'PG', 'PG-13', 'R', 'NC-17'];
// We use integer values (0-5 scale) for maxMetacriticRating
const gameRatingCaps = [
  { value: 1, label: 'Poor (1+)' },
  { value: 2, label: 'Fair (2+)' },
  { value: 3, label: 'Good (3+)' },
  { value: 4, label: 'Great (4+)' },
  { value: 5, label: 'Masterpiece (5)' },
];

export const RestrictionToggles = ({
  blockedMovieGenreIds = [],
  onChangeBlockedMovieGenres,
  blockedGameGenreIds = [],
  onChangeBlockedGameGenres,
  maxContentRating,
  onChangeMaxContentRating,
  maxMetacriticRating,
  onChangeMaxMetacriticRating,
}) => {
  const [movieGenres, setMovieGenres] = useState([]);
  const [gameGenres, setGameGenres] = useState([]);
  const [isLoadingGenres, setIsLoadingGenres] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const [moviesRes, gamesRes] = await Promise.all([
          movieService.getGenres(),
          gameService.getGenres()
        ]);
        setMovieGenres(moviesRes || []);
        setGameGenres(gamesRes || []);
      } catch (error) {
        console.error('Failed to fetch genres for restrictions:', error);
      } finally {
        setIsLoadingGenres(false);
      }
    };

    fetchGenres();
  }, []);

  const toggleMovieGenre = (id) => {
    if (blockedMovieGenreIds.includes(id)) {
      onChangeBlockedMovieGenres(blockedMovieGenreIds.filter((g) => g !== id));
    } else {
      onChangeBlockedMovieGenres([...blockedMovieGenreIds, id]);
    }
  };

  const toggleGameGenre = (id) => {
    if (blockedGameGenreIds.includes(id)) {
      onChangeBlockedGameGenres(blockedGameGenreIds.filter((g) => g !== id));
    } else {
      onChangeBlockedGameGenres([...blockedGameGenreIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-700/50 pb-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Content Restrictions</h3>
          <p className="text-sm text-zinc-400">Select content that should be hidden from this account.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Blocked Movie Genres */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Blocked Movie Genres</h4>
          <div className="flex flex-wrap gap-2">
            {isLoadingGenres && <span className="text-sm text-zinc-500">Loading...</span>}
            {movieGenres.map((genre) => (
              <button
                key={genre.genreId}
                type="button"
                onClick={() => toggleMovieGenre(genre.genreId)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  blockedMovieGenreIds.includes(genre.genreId)
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_10px_rgba(138,43,226,0.3)]'
                    : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Blocked Game Genres */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Blocked Game Genres</h4>
          <div className="flex flex-wrap gap-2">
            {isLoadingGenres && <span className="text-sm text-zinc-500">Loading...</span>}
            {gameGenres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGameGenre(genre.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  blockedGameGenreIds.includes(genre.id)
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_10px_rgba(138,43,226,0.3)]'
                    : 'bg-zinc-900/60 border-zinc-700/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
