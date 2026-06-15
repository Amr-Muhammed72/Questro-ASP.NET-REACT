import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFamilyStore = create(
  persist(
    (set) => ({
      isChild: false,
      restrictions: null,
      
      setRestrictions: (restrictionsData) => set({ 
        isChild: true, 
        restrictions: restrictionsData 
      }),
      
      clearRestrictions: () => set({ 
        isChild: false, 
        restrictions: null 
      })
    }),
    {
      name: 'family-storage', // key in localStorage
    }
  )
);
