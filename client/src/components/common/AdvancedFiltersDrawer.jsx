import React, { useState, useEffect, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SlideOutDrawer } from './SlideOutDrawer';
import { FilterDropdown, FilterPills, FilterSlider, FilterInput } from './filters';
import { useFilterSync } from '../../hooks/useFilterSync';
import { getGenres } from '../../features/movies/api/movieService';
import { gameService } from '../../features/games/api/gameService';
import { useMovieStore } from '../../features/movies/store/useMovieStore';
import { useGameStore } from '../../features/games/store/useGameStore';

const MOVIE_SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'release_date.desc', label: 'Newest Releases' },
  { value: 'vote_average.desc', label: 'Top Rated' },
  { value: 'revenue.desc', label: 'Highest Grossing' },
  { value: 'title.asc', label: 'Title (A-Z)' },
];

const GAME_SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'latest', label: 'Newest Releases' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'Name (A-Z)' },
];

const QUALITY_OPTIONS = [
  { value: '', label: 'Quality: Any' },
  { value: '4k', label: '4K Ultra HD' },
  { value: '1080p', label: '1080p Full HD' },
  { value: '720p', label: '720p HD' },
  { value: 'sd', label: 'SD' },
  { value: 'hdr', label: 'HDR' },
];

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Language: Any' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
];

const DEFAULT_PLATFORM_OPTIONS = [
  { value: null, label: 'Any' },
  { value: '', label: 'All Platforms' },
  { value: 1, label: 'PC' },
  { value: 2, label: 'PlayStation 5' },
  { value: 3, label: 'PlayStation 4' },
  { value: 4, label: 'Xbox Series' },
  { value: 5, label: 'Xbox One' },
  { value: 6, label: 'Nintendo Switch' },
];

export const AdvancedFiltersDrawer = ({ isOpen, onClose, mode = 'movies', platformOptions = [] }) => {
  const store = mode === 'movies' ? useMovieStore : useGameStore;
  const { filters, updateFilter, resetFilters } = useFilterSync(store);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchGenres = async () => {
      try {
        const data = mode === 'movies' ? await getGenres() : await gameService.getGenres();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (isMounted) setGenres(list);
      } catch (error) {
        console.error('Failed to load genres', error);
      }
    };
    const fetchPlatforms = async () => {
      if (mode !== 'games') return;
      try {
        const data = await gameService.getPlatforms();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (isMounted) setPlatforms(list);
      } catch (error) {
        console.error('Failed to load platforms', error);
      }
    };
    fetchGenres();
    fetchPlatforms();
    return () => { isMounted = false; };
  }, [mode]);

  const genreOptions = useMemo(() => {
    return genres.map(g => ({ value: String(g.genreId || g.id), label: g.name }));
  }, [genres]);

  const platformOptionsFromApi = useMemo(() => {
    return [
      { value: null, label: 'Any' },
      ...platforms.map(p => ({ value: String(p.platformId || p.id), label: p.name }))
    ];
  }, [platforms]);

  const sortOptions = mode === 'movies' ? MOVIE_SORT_OPTIONS : GAME_SORT_OPTIONS;
  const ratingScale = mode === 'movies' ? { min: 0, max: 10 } : { min: 1, max: 5 };

  const footer = (
    <div className="flex gap-3">
      <button
        onClick={() => resetFilters()}
        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
      >
        Clear All
      </button>
      <button
        onClick={onClose}
        className="flex-1 rounded-lg bg-white py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
      >
        View Results
      </button>
    </div>
  );

  return (
    <SlideOutDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'movies' ? 'Movie Filters' : 'Game Filters'}
      footer={footer}
    >
      <div className="space-y-8 pb-4">
        {/* Sort By */}
        <FilterDropdown
          label="Sort By"
          value={filters.sort || ''}
          options={sortOptions}
          onChange={(v) => updateFilter('sort', v)}
          placeholder="Featured"
        />

        {/* Year */}
        <FilterInput
          label="Release Year"
          type="text"
          inputMode="numeric"
          value={filters.year || ''}
          onChange={(v) => {
            const numericValue = v.replace(/[^0-9]/g, '').slice(0, 4);
            updateFilter('year', numericValue);
          }}
          placeholder="e.g. 2024"
          icon={null}
        />

        {/* Dynamic Filters depending on mode */}
        {mode === 'movies' && (
          <>
            <FilterDropdown
              label="Quality"
              value={filters.quality || ''}
              options={QUALITY_OPTIONS}
              onChange={(v) => updateFilter('quality', v)}
              placeholder="Any quality"
            />
            <FilterDropdown
              label="Language"
              value={filters.language || ''}
              options={LANGUAGE_OPTIONS}
              onChange={(v) => updateFilter('language', v)}
              placeholder="Any language"
              searchable
              searchPlaceholder="Find language..."
            />
          </>
        )}

        {mode === 'games' && (
          <FilterDropdown
            label="Platform"
            value={filters.platformId || ''}
            options={platformOptions.length ? platformOptions : (platformOptionsFromApi.length ? platformOptionsFromApi : DEFAULT_PLATFORM_OPTIONS)}
            onChange={(v) => updateFilter('platformId', v)}
            placeholder="All Platforms"
            searchable
          />
        )}

        {/* Minimum Rating Slider */}
        <FilterSlider
          label="Minimum Rating"
          min={ratingScale.min}
          max={ratingScale.max}
          step={0.5}
          value={filters.minRating}
          onChange={(v) => updateFilter('minRating', v)}
          formatValue={(v) => (v === ratingScale.min ? 'Any' : `${v}+ \u2605`)}
        />

        {/* Genres */}
        <FilterPills
          label="Genres"
          options={genreOptions}
          selectedValue={filters.genreId || ''}
          onChange={(v) => updateFilter('genreId', v)}
        />
      </div>
    </SlideOutDrawer>
  );
};