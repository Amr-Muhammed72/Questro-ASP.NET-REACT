import { create } from 'zustand';

export const useProfileStore = create((set) => ({
  currentProfile: null,
  followStats: null,
  isLoading: false,
  error: null,
  imageUpdateStamp: Date.now(),

  setCurrentProfile: (profile) => set({
    currentProfile: profile,
    error: null
  }),

  setImageUpdateStamp: (stamp) => set({ imageUpdateStamp: stamp }),

  setFollowStats: (stats) => set({ followStats: stats }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearProfile: () => set({
    currentProfile: null,
    followStats: null,
    error: null,
    imageUpdateStamp: Date.now()
  })
}));
