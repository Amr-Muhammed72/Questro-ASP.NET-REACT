import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, Gamepad2, User, Users, ChevronRight } from 'lucide-react';
import { useGlobalSearch } from '../hooks/useGlobalSearch';

import { BASE_URL } from '../../../lib/apiClient';

const getProfilePicUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  const baseUrl = BASE_URL.replace(/\/api$/, '');
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${baseUrl}${path}`;
};

const GlobalSearchDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { query, setQuery, results, isLoading, hasQuery } = useGlobalSearch(4);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = useMemo(() => {
    if (!results) return [];
    const flat = [];
    if (filter === 'all' || filter === 'movies') flat.push(...(results.movies || []).map(m => ({ ...m, _type: 'movie', _id: m.tmdbId })));
    if (filter === 'all' || filter === 'games') flat.push(...(results.games || []).map(g => ({ ...g, _type: 'game', _id: g.rawgId })));
    if (filter === 'all' || filter === 'actors') flat.push(...(results.actors || []).map(a => ({ ...a, _type: 'actor', _id: a.tmdbId })));
    if (filter === 'all' || filter === 'users') flat.push(...(results.users || []).map(u => ({ ...u, _type: 'user', _id: u.id })));
    return flat;
  }, [results, filter]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          const item = items[selectedIndex];
          if (item._type === 'movie') navigate(`/movies/${item.tmdbId}`);
          else if (item._type === 'game') navigate(`/games/${item.rawgId}`);
          else if (item._type === 'actor') navigate(`/staff/${item.tmdbId}`);
          else if (item._type === 'user') navigate(`/users/${item.id}`);
          handleClose();
        } else if (items.length > 0) {
          // If they hit enter with query but nothing selected, optionally go to first result
          const item = items[0];
          if (item._type === 'movie') navigate(`/movies/${item.tmdbId}`);
          else if (item._type === 'game') navigate(`/games/${item.rawgId}`);
          else if (item._type === 'actor') navigate(`/staff/${item.tmdbId}`);
          else if (item._type === 'user') navigate(`/users/${item.id}`);
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, navigate]);

  // Reset selected index when query or filter changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, filter]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setFilter('all');
    setSelectedIndex(-1);
  };

  const hasResults = items.length > 0;

  return (
    <div className="relative flex items-center justify-end w-10 h-10" ref={containerRef}>
      {/* Search Input Container - Absolute positioned to grow leftwards without pushing navbar items */}
      <motion.div 
        initial={false}
        animate={{ width: isOpen ? (window.innerWidth < 768 ? 280 : 400) : 40 }}
        className={`absolute right-0 top-0 flex items-center h-10 rounded-full border overflow-hidden transition-colors z-[60] shadow-lg ${isOpen ? 'bg-[#09090b]/95 backdrop-blur-2xl border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-zinc-800/50 hover:bg-zinc-800/80 border-white/10'}`}
      >
        <button 
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          className="absolute left-0 w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <Search className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search movies, games, users..."
          className={`w-full h-full bg-transparent text-sm text-white pl-10 pr-10 outline-none placeholder:text-zinc-500 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          tabIndex={isOpen ? 0 : -1}
        />

        {query && isOpen && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isOpen && hasQuery && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[calc(100%+16px)] right-0 w-[320px] sm:w-[500px] max-h-[75vh] overflow-hidden flex flex-col bg-[#09090b]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] z-[200] ring-1 ring-white/5"
          >
            {/* Filter Tabs */}
            {hasResults && !isLoading && (
              <div className="flex gap-2 overflow-x-auto p-3 border-b border-white/5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-shrink-0 bg-white/[0.02]">
                {['all', 'movies', 'games', 'actors', 'users'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      filter === f 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25' 
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                </div>
              )}

              {!isLoading && !hasResults && (
                <div className="text-center py-12 text-zinc-500 text-sm flex flex-col items-center">
                  <Search className="w-10 h-10 mb-3 opacity-20" />
                  No results found for "{query}"
                </div>
              )}

              {!isLoading && hasResults && (
                <div className="space-y-6">
                  
                  {/* Movies */}
                  {(filter === 'all' || filter === 'movies') && results.movies?.length > 0 && (
                    <div>
                      {filter === 'all' && (
                        <div className="px-2 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                          <Film className="w-3.5 h-3.5 text-blue-400" /> Movies
                        </div>
                      )}
                      <div className="space-y-1">
                        {results.movies.map((movie) => {
                          const isSelected = items[selectedIndex]?._id === movie.tmdbId && items[selectedIndex]?._type === 'movie';
                          return (
                            <Link key={movie.tmdbId} to={`/movies/${movie.tmdbId}`} onClick={handleClose} className={`flex items-center gap-4 p-2.5 rounded-xl transition-all duration-200 group ${isSelected ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}>
                              {movie.posterUrl ? (
                                <img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 rounded-md object-cover bg-zinc-800 flex-shrink-0 shadow-md" />
                              ) : (
                                <div className="w-12 h-16 rounded-md bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-md">
                                  <Film className="w-5 h-5 text-blue-400/50" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-zinc-100 truncate group-hover:text-blue-400 transition-colors">{movie.title}</h4>
                                <p className="text-xs text-zinc-500 mt-0.5">{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'Unknown'}</p>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-zinc-600 transition-opacity ${isSelected ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100'}`} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Games */}
                  {(filter === 'all' || filter === 'games') && results.games?.length > 0 && (
                    <div>
                      {filter === 'all' && (
                        <div className="px-2 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                          <Gamepad2 className="w-3.5 h-3.5 text-purple-400" /> Games
                        </div>
                      )}
                      <div className="space-y-1">
                        {results.games.map((game) => {
                          const isSelected = items[selectedIndex]?._id === game.rawgId && items[selectedIndex]?._type === 'game';
                          return (
                            <Link key={game.rawgId} to={`/games/${game.rawgId}`} onClick={handleClose} className={`flex items-center gap-4 p-2.5 rounded-xl transition-all duration-200 group ${isSelected ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}>
                              {game.backgroundImageUrl ? (
                                <img src={game.backgroundImageUrl} alt={game.name} className="w-16 h-12 rounded-md object-cover bg-zinc-800 flex-shrink-0 shadow-md" />
                              ) : (
                                <div className="w-16 h-12 rounded-md bg-gradient-to-br from-purple-900/40 to-fuchsia-900/40 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-md">
                                  <Gamepad2 className="w-5 h-5 text-purple-400/50" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-zinc-100 truncate group-hover:text-purple-400 transition-colors">{game.name}</h4>
                                <p className="text-xs text-zinc-500 mt-0.5">{game.released ? new Date(game.released).getFullYear() : 'Unknown'}</p>
                              </div>
                              <ChevronRight className={`w-4 h-4 text-zinc-600 transition-opacity ${isSelected ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100'}`} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actors */}
                  {(filter === 'all' || filter === 'actors') && results.actors?.length > 0 && (
                    <div>
                      {filter === 'all' && (
                        <div className="px-2 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                          <User className="w-3.5 h-3.5 text-emerald-400" /> Actors
                        </div>
                      )}
                      <div className="space-y-1">
                        {results.actors.map((actor) => {
                          const isSelected = items[selectedIndex]?._id === actor.tmdbId && items[selectedIndex]?._type === 'actor';
                          const picUrl = getProfilePicUrl(actor.profileUrl);
                          return (
                            <Link key={actor.tmdbId} to={`/staff/${actor.tmdbId}`} onClick={handleClose} className={`flex items-center gap-4 p-2.5 rounded-xl transition-all duration-200 group ${isSelected ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}>
                              {picUrl ? (
                                <img src={picUrl} alt={actor.name} className="w-10 h-10 rounded-full object-cover bg-zinc-800 flex-shrink-0 shadow-md" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-md">
                                  <User className="w-4 h-4 text-emerald-400/50" />
                                </div>
                              )}
                              <h4 className="text-sm font-bold text-zinc-100 flex-1 truncate group-hover:text-emerald-400 transition-colors">{actor.name}</h4>
                              <ChevronRight className={`w-4 h-4 text-zinc-600 transition-opacity ${isSelected ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100'}`} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Users */}
                  {(filter === 'all' || filter === 'users') && results.users?.length > 0 && (
                    <div>
                      {filter === 'all' && (
                        <div className="px-2 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                          <Users className="w-3.5 h-3.5 text-orange-400" /> Users
                        </div>
                      )}
                      <div className="space-y-1">
                        {results.users.map((user) => {
                          const isSelected = items[selectedIndex]?._id === user.id && items[selectedIndex]?._type === 'user';
                          const picUrl = getProfilePicUrl(user.profilePictureUrl);
                          return (
                            <Link key={user.id} to={`/users/${user.id}`} onClick={handleClose} className={`flex items-center gap-4 p-2.5 rounded-xl transition-all duration-200 group ${isSelected ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}>
                              {picUrl ? (
                                <img src={picUrl} alt={user.username} className="w-10 h-10 rounded-full object-cover bg-zinc-800 flex-shrink-0 shadow-md" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-900/40 to-amber-900/40 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-md">
                                  <span className="text-orange-400/70 text-sm font-bold uppercase">{user.username.charAt(0)}</span>
                                </div>
                              )}
                              <h4 className="text-sm font-bold text-zinc-100 flex-1 truncate group-hover:text-orange-400 transition-colors">@{user.username}</h4>
                              <ChevronRight className={`w-4 h-4 text-zinc-600 transition-opacity ${isSelected ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100'}`} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* No Results for Specific Filter */}
                  {filter !== 'all' && results[filter]?.length === 0 && (
                    <div className="text-center py-12 text-zinc-500 text-sm flex flex-col items-center">
                      <Search className="w-10 h-10 mb-3 opacity-20" />
                      No {filter} found for "{query}"
                    </div>
                  )}

                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSearchDropdown;
