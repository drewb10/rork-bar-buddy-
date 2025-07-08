import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isHydrated: boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      isHydrated: false,
      setTheme: (theme: Theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);

// Safe hook that always returns valid state
export const useThemeStoreSafe = () => {
  try {
    const store = useThemeStore();
    if (!store) {
      return { theme: 'dark' as Theme, setTheme: () => {}, isHydrated: false };
    }
    return store;
  } catch (error) {
    console.warn('Error accessing theme store:', error);
    return { theme: 'dark' as Theme, setTheme: () => {}, isHydrated: false };
  }
};

// Static method to get theme without hooks
export const getTheme = (): Theme => {
  try {
    const state = useThemeStore.getState();
    return state?.theme || 'dark';
  } catch (error) {
    console.warn('Error getting theme:', error);
    return 'dark';
  }
};