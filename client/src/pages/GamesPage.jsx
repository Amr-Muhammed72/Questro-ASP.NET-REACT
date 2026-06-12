import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, Search } from 'lucide-react';

import { useDebounce } from '../hooks/useDebounce';

import NavBar from '../components/layout/NavBar';

import { AdvancedFiltersDrawer } from '../components/common/AdvancedFiltersDrawer';
import BrowseViewWrapper from '../features/games/components/BrowseViewWrapper';
import SearchViewWrapper from '../features/games/components/SearchViewWrapper';

const GamesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebounce(localSearch, 500);

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

  const filtersFromParams = useMemo(() => ({
    search,
    genreId,
    platformId,
    year,
    minRating,
    maxRating,
    sort,
    list,
  }), [search, genreId, platformId, year, minRating, maxRating, sort, list]);

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
    }, { replace: true });
  }, [setSearchParams]);

  return (
    <div className="relative min-h-screen font-sans pb-20">
      <div className="absolute inset-0 bg-black/20 z-0"></div>
      <NavBar onVisibilityChange={setIsNavVisible} forceHidden={areFiltersOpen} />
      <div className={`relative z-10 w-full transition-all duration-300 flex flex-col ${isNavVisible && !areFiltersOpen ? 'pt-20' : 'pt-4'}`}>

        <div className="w-full relative flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh] py-12 px-4 overflow-hidden mb-8">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[60vw] h-[60vw] max-w-[800px] max-h-[800px]"></div>
          </div>

          <div className="relative z-10 w-full max-w-4xl flex flex-col items-center mt-[-4rem]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-2 drop-shadow-2xl text-center leading-tight">
              Discover The Perfect Game <br className="hidden sm:block" /> With An Effortless Search And Selection
            </h1>

            <div className="relative w-full max-w-3xl flex flex-col sm:flex-row items-center gap-4 mt-6">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        if (localSearch.trim()) next.set('search', localSearch.trim());
                        else next.delete('search');
                        return next;
                      }, { replace: true });
                    }
                  }}
                  className="w-full bg-zinc-900/60 border border-zinc-700 rounded-full py-3 sm:py-4 pl-12 pr-12 text-sm sm:text-base md:text-lg text-white placeholder-zinc-500 focus:ring-1 focus:ring-white focus:border-zinc-500 focus:outline-none transition-all backdrop-blur-md"
                />
                <div className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none">
                  <Search className="w-5 h-5" />
                </div>
                {localSearch && (
                  <button
                    onClick={() => setLocalSearch('')}
                    className="absolute right-4 sm:right-5 top-1/2 transform -translate-y-1/2 rounded-full p-1 hover:bg-zinc-800 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <button
                onClick={() => setAreFiltersOpen(true)}
                className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/80 px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-zinc-100 hover:bg-zinc-700 hover:border-zinc-500 transition-all"
              >
                <SlidersHorizontal className="h-5 w-5" />
                Filter
              </button>
            </div>
          </div>
        </div>

        <div className="w-full px-4 md:px-8 lg:px-12">
          <div className="flex flex-col w-full">
            <AdvancedFiltersDrawer
              isOpen={areFiltersOpen}
              onClose={() => setAreFiltersOpen(false)}
              mode="games"
            />

            <div className="w-full min-w-0">
              <AnimatePresence mode="sync">
                {isBrowsing ? (
                  <motion.div
                    key="browsing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BrowseViewWrapper onGenreSearch={handleBrowseGenre} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="searching"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SearchViewWrapper filters={filtersFromParams} />
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