import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useMovieStore = create(
  persist(
    (set) => ({
      filters: {
        search: '',
        genreId: '',
        minRating: 1,
        year: '',
        sort: 'popularity.desc'
      },
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),

      clearFilters: () => set({
        filters: {
          search: '',
          genreId: '',
          minRating: 1,
          year: '',
          sort: 'popularity.desc'
        }
      })
    }),
    {
      name: 'questro-movie-filters',
    }
  )
);