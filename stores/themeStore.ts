import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Safe hook that always returns valid state
export const useThemeStoreSafe = () => {
  try {
    const store = useThemeStore();
    if (!store) {
      return { theme: 'dark' as Theme, setTheme: () => {} };
    }
    return store;
  } catch (error) {
    console.warn('Error accessing theme store:', error);
    return { theme: 'dark' as Theme, setTheme: () => {} };
  }
};