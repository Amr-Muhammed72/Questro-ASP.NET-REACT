import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useGameStore = create(
persist(
    (set) => ({
      filters: {
        search: '',
        genreId: '',
        platformId: '',
        year: '',
        minRating: '',
        maxRating: '',
        sort: ''
      },
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      clearFilters: () => set({
        filters: {
          search: '',
          genreId: '',
          platformId: '',
          year: '',
          minRating: '',
          maxRating: '',
          sort: ''
        }
      })
    }),
    {
      name: 'questro-game-filters',
    }
  )
);