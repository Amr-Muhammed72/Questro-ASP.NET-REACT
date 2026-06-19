import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import movieService from '../../movies/api/movieService';
import gameService from '../../games/api/gameService';

export const RestrictionToggles = ({
  blockedMovieGenreIds = [],
  onChangeBlockedMovieGenres,
  blockedGameGenreIds = [],
  onChangeBlockedGameGenres,
}) => {
  const { data: movieGenres = [], isLoading: isMoviesLoading, error: moviesError } = useQuery({
    queryKey: ['movieGenres'],
    queryFn: movieService.getGenres,
  });

  const { data: gameGenres = [], isLoading: isGamesLoading, error: gamesError } = useQuery({
    queryKey: ['gameGenres'],
    queryFn: gameService.getGenres,
  });

  const isLoadingGenres = isMoviesLoading || isGamesLoading;


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
          {moviesError && <div className="text-red-400 text-sm mb-2">Error loading movie genres: {moviesError.message || 'Unknown error'}</div>}
          <div className="flex flex-wrap gap-2">
            {isMoviesLoading && <span className="text-sm text-zinc-500">Loading...</span>}
            {Array.isArray(movieGenres) && movieGenres.map((genre) => (
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
          {gamesError && <div className="text-red-400 text-sm mb-2">Error loading game genres: {gamesError.message || 'Unknown error'}</div>}
          <div className="flex flex-wrap gap-2">
            {isGamesLoading && <span className="text-sm text-zinc-500">Loading...</span>}
            {Array.isArray(gameGenres) && gameGenres.map((genre) => (
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
