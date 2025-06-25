import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isInitialized: boolean;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      isInitialized: false,
      setTheme: (theme: Theme) => {
        try {
          set({ theme, isInitialized: true });
        } catch (error) {
          console.warn('Error setting theme:', error);
        }
      },
      toggleTheme: () => {
        try {
          const state = get();
          const currentTheme = state?.theme || 'dark';
          set({ theme: currentTheme === 'dark' ? 'light' : 'dark', isInitialized: true });
        } catch (error) {
          console.warn('Error toggling theme:', error);
          set({ theme: 'dark', isInitialized: true });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure we always have a valid theme and mark as initialized
        if (!state || !state.theme) {
          return { 
            theme: 'dark' as Theme, 
            setTheme: () => {}, 
            toggleTheme: () => {},
            isInitialized: true
          };
        }
        return { ...state, isInitialized: true };
      },
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__themeStore = useThemeStore;
}