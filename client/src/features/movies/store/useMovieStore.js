import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useMovieStore = create(
  persist(
    (set) => ({
      filters: {
        search: '',
        genreId: '',
        language: '',
        year: '',
        minRating: '',
        maxRating: '',
        quality: '',
        sort: ''
      },
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      clearFilters: () => set({
        filters: {
          search: '',
          genreId: '',
          language: '',
          year: '',
          minRating: '',
          maxRating: '',
          quality: '',
          sort: ''
        }
      })
    }),
    {
      name: 'questro-movie-filters',
    }
  )
);