import { create } from 'zustand';

/**
 * Game filter store — intentionally NOT persisted.
 *
 * The URL (searchParams) is the single source of truth for filters.
 * Persisting this store would cause stale filters to rehydrate from
 * localStorage on mount, triggering an extra redundant API fetch before
 * the URL params are read and applied.
 */
export const useGameStore = create((set) => ({
  filters: {
    search:     '',
    genreId:    '',
    platformId: '',
    year:       '',
    minRating:  '',
    maxRating:  '',
    sort:       '',
  },

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  clearFilters: () =>
    set({
      filters: {
        search:     '',
        genreId:    '',
        platformId: '',
        year:       '',
        minRating:  '',
        maxRating:  '',
        sort:       '',
      },
    }),
}));