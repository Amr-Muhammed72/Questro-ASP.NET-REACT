import { create } from 'zustand';

export const useProfileStore = create((set) => ({
  currentProfile: null,
  followStats: null,
  isLoading: false,
  error: null,

  setCurrentProfile: (profile) => set({
    currentProfile: profile,
    error: null
  }),

  setFollowStats: (stats) => set({ followStats: stats }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearProfile: () => set({
    currentProfile: null,
    followStats: null,
    error: null
  })
}));
