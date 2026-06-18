import { create } from 'zustand';

export const useProfileStore = create((set) => ({
  myProfile: null, // Global authenticated user's profile for the navbar
  currentProfile: null, // The profile currently being viewed on the ProfilePage
  followStats: null,
  isLoading: false,
  error: null,
  imageUpdateStamp: Date.now(),

  setMyProfile: (profile) => set({
    myProfile: profile,
  }),

  setCurrentProfile: (profile) => set({
    currentProfile: profile,
    error: null
  }),

  setImageUpdateStamp: (stamp) => set({ imageUpdateStamp: stamp }),

  setFollowStats: (stats) => set({ followStats: stats }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearProfile: () => set({
    myProfile: null,
    currentProfile: null,
    followStats: null,
    error: null,
  })
}));
