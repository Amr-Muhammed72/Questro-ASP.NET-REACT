import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, Search } from 'lucide-react';

import { useDebounce } from '../hooks/useDebounce';



import { AdvancedFiltersDrawer } from '../components/common/AdvancedFiltersDrawer';
import { ActiveFiltersBar } from '../components/common/ActiveFiltersBar';
import BrowseViewWrapper from '../features/games/components/BrowseViewWrapper';
import { useGamesDiscovery } from '../features/games/hooks/useGamesDiscovery';
import SearchView from '../features/games/components/SearchView';
import HeroBackground from '../components/ui/HeroBackground';

const GamesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const searchParam = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(searchParam);
  const debouncedSearch = useDebounce(localSearch, 500);

  useEffect(() => {
    setLocalSearch(searchParam);
  }, [searchParam]);

  useEffect(() => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (debouncedSearch.trim()) {
        next.set('search', debouncedSearch.trim());
      } else {
        next.delete('search');
      }
      return next;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  const platformId = searchParams.get('platformId') || null;
  const year = searchParams.get('year') || null;
  const minRating = searchParams.get('minRating') || null;
  const maxRating = searchParams.get('maxRating') || null;
  const sort = searchParams.get('sort') || null;
  const genreId = searchParams.get('genreId') || null;
  const list = searchParams.get('list') || null;
  const search = searchParams.get('search') || null;

  const isBrowsing = useMemo(() => {
    return !search && !genreId && !list && !platformId && !year && !minRating && !maxRating && !sort;
  }, [search, genreId, list, platformId, year, minRating, maxRating, sort]);

  const handleBrowseGenre = useCallback((genreId) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (genreId) next.set('genreId', String(genreId));
      else next.delete('genreId');
      next.delete('search');
      next.delete('list');
      return next;
    });
  }, [setSearchParams]);

  const buildFilters = (params) => ({
    search: params.get('search') || null,
    genreId: params.get('genreId') || null,
    platformId: params.get('platformId') || null,
    year: params.get('year') || null,
    minRating: params.get('minRating') || null,
    maxRating: params.get('maxRating') || null,
    sort: params.get('sort') || null,
    list: params.get('list') || null,
  });

  const {
    games,
    loading: searchLoading,
    error: searchError,
    currentPage,
    totalPages,
    updateFilters,
    goToPage,
  } = useGamesDiscovery();

  useEffect(() => {
    const filters = buildFilters(searchParams);
    updateFilters(filters);
  }, [searchParams, updateFilters]);

  // Keep old view rendered until loading finishes
  const [activeView, setActiveView] = useState(isBrowsing ? 'browse' : 'search');
  
  useEffect(() => {
    if (isBrowsing) {
      setActiveView('browse');
    } else {
      // Wait for search data to load before flipping the view
      if (!searchLoading) {
        setActiveView('search');
      }
    }
  }, [isBrowsing, searchLoading]);

  // Scroll to top of page when view flips to search
  const prevActiveView = React.useRef(activeView);
  useEffect(() => {
    if (prevActiveView.current === 'browse' && activeView === 'search') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    prevActiveView.current = activeView;
  }, [activeView]);



  return (
    <div className="relative min-h-screen font-sans pb-20 bg-[#09090b]">
      
      <div className="relative z-10 w-full transition-all duration-300 flex flex-col">

        {/* Hero Section Container */}
        <div className={`w-full relative flex flex-col items-center justify-center min-h-[50vh] md:min-h-[65vh] px-4 overflow-hidden mb-8 ${isNavVisible && !areFiltersOpen ? 'pt-32 pb-16' : 'pt-16 pb-12'}`}>
          <HeroBackground type="games" />

          <div className="relative z-10 w-full max-w-4xl flex flex-col items-center mt-[-2rem]">
            
            <div className="mb-6 px-5 py-1.5 rounded-full border border-zinc-700/60 bg-zinc-900/60 backdrop-blur-md text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase">
              Ultimate Game Library
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 drop-shadow-2xl text-center leading-tight">
              Discover The Perfect Game <br className="hidden sm:block" /> With An Effortless Search
            </h1>
            
            <p className="text-zinc-300 text-center max-w-2xl text-sm sm:text-base md:text-lg mb-6 drop-shadow-md">
              Explore thousands of games tailored to your taste with our powerful filters.
            </p>

            <div className="relative w-full max-w-3xl mt-4">
              <div className="relative flex items-center w-full bg-zinc-900/80 border border-zinc-700 rounded-full p-1.5 shadow-2xl backdrop-blur-md transition-all focus-within:border-zinc-500">
                <div className="pl-4 text-zinc-400 pointer-events-none">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search for games, platforms..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        if (localSearch.trim()) next.set('search', localSearch.trim());
                        else next.delete('search');
                        return next;
                      });
                    }
                  }}
                  className="w-full bg-transparent border-none py-3 px-3 text-base md:text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
                />
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch('')}
                    className="mr-2 rounded-full p-1 hover:bg-zinc-800 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => setAreFiltersOpen(true)}
                  className="flex-shrink-0 flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition-colors shadow-md"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </button>
              </div>
            </div>

            <ActiveFiltersBar mode="games" searchParams={searchParams} setSearchParams={setSearchParams} />
          </div>
        </div>

        <div className="w-full px-4 md:px-8 lg:px-12">
          <div className="flex flex-col w-full">
            <AdvancedFiltersDrawer
              isOpen={areFiltersOpen}
              onClose={() => setAreFiltersOpen(false)}
              mode="games"
            />

            <div id="results-grid" className="w-full min-w-0" style={{ scrollMarginTop: '100px', minHeight: '600px' }}>
              <AnimatePresence mode="popLayout">
                {activeView === 'browse' ? (
                  <motion.div
                    key="browsing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BrowseViewWrapper onGenreSearch={handleBrowseGenre} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="searching"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SearchView
                      games={games}
                      loading={searchLoading}
                      error={searchError}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
