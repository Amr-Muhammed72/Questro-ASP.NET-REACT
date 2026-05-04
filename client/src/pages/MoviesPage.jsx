import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMoviesDiscovery } from '../hooks/useMoviesDiscovery';
import { useBrowseData } from '../hooks/useBrowseData';
import NavBar from '../components/NavBar';
import bgImage from '../assets/main-background.png';
import MoviesHeader from '../components/Movies/MoviesHeader';
import GenrePills from '../components/Movies/GenrePills';
import BrowseView from '../components/Movies/BrowseView';
import SearchView from '../components/Movies/SearchView';

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || null;
  const initialList = searchParams.get('list') || null;

  const {
    movies,
    loading: discoveryLoading,
    hasMore,
    error,
    filters,
    loadMore,
    updateFilters,
  } = useMoviesDiscovery();

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [activeGenreId, setActiveGenreId] = useState(initialGenre);
  const [activeList, setActiveList] = useState(initialList);

  const {
    trending,
    recentlyAdded,
    recommended,
    genresWithMovies
  } = useBrowseData();

  useEffect(() => {
    if (initialSearch || initialGenre || initialList) {
      updateFilters({ search: initialSearch, genreId: initialGenre, list: initialList });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Also watch for URL changes if someone clicks a category
  useEffect(() => {
    const listParam = searchParams.get('list');
    if (listParam !== activeList) {
      setActiveList(listParam);
      updateFilters({ list: listParam, search: searchInput, genreId: activeGenreId });
    }
  }, [searchParams, activeList, updateFilters, searchInput, activeGenreId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters({ search: searchInput, genreId: activeGenreId, list: activeList });
      setSearchParams(prev => {
        if (searchInput) prev.set('q', searchInput);
        else prev.delete('q');
        
        if (activeGenreId) prev.set('genre', activeGenreId);
        else prev.delete('genre');

        if (activeList) prev.set('list', activeList);
        else prev.delete('list');
        
        return prev;
      }, { replace: true });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, activeGenreId, activeList, setSearchParams, updateFilters]);

  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
    setActiveList(null); // Clear list when manually searching
  }, []);

  const handleGenreSearch = useCallback((newFilters) => {
    setActiveGenreId(newFilters.genreId);
    setActiveList(null); // Clear list when picking genre
    updateFilters({ ...newFilters, list: null, search: searchInput });
    setSearchParams(prev => {
      if (newFilters.genreId) prev.set('genre', newFilters.genreId);
      else prev.delete('genre');
      prev.delete('list');
      return prev;
    });
  }, [searchInput, updateFilters, setSearchParams]);
  
  const handleSearchSubmit = useCallback(() => {
    setActiveList(null);
    updateFilters({ search: searchInput, genreId: activeGenreId, list: null });
    setSearchParams(prev => {
      if (searchInput) prev.set('q', searchInput);
      else prev.delete('q');
      
      if (activeGenreId) prev.set('genre', activeGenreId);
      else prev.delete('genre');
      
      return prev;
    }, { replace: true });
  }, [searchInput, activeGenreId, updateFilters, setSearchParams]);

  const isBrowsing = useMemo(() => {
    return !searchInput && !activeGenreId && !activeList;
  }, [searchInput, activeGenreId, activeList]);

  const backgroundStyle = useMemo(() => ({
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }), []);

  return (
    <div className="relative min-h-screen font-sans pb-20" style={backgroundStyle}>
      <div className="absolute inset-0 bg-black/50 z-0"></div>
      <NavBar />
      <div className="relative z-10 w-full pt-16">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 space-y-8">
          <MoviesHeader 
            searchInput={searchInput || ''} 
            handleSearchChange={handleSearchChange} 
            onSearchSubmit={handleSearchSubmit} 
          />

          <GenrePills 
            activeGenreId={activeGenreId} 
            updateFilters={handleGenreSearch} 
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center backdrop-blur-sm mt-8 mx-auto max-w-4xl">
              Oops! Something went wrong: {error}
            </div>
          )}
        </div>

        <div className="mt-12 w-full">
          {isBrowsing ? (
            <BrowseView
              recentlyAdded={recentlyAdded}
              trending={trending}
              recommended={recommended}
              genresWithMovies={genresWithMovies}
              onGenreSearch={handleGenreSearch}
            />
          ) : (
            <SearchView
              movies={movies}
              loading={discoveryLoading}
              hasMore={hasMore}
              error={error}
              loadMore={loadMore}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default MoviesPage;
