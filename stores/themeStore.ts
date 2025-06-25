import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isInitialized: boolean;
  isHydrated: boolean;
}

// Default state for when store isn't ready
const defaultState: ThemeState = {
  theme: 'dark',
  isInitialized: true,
  isHydrated: true,
  setTheme: () => {},
  toggleTheme: () => {},
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      isInitialized: false,
      isHydrated: false,
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
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Error rehydrating theme store:', error);
          return defaultState;
        }
        
        // Ensure we always have a valid theme and mark as initialized
        if (!state || !state.theme) {
          return { 
            ...defaultState,
            isHydrated: true
          };
        }
        return { ...state, isInitialized: true, isHydrated: true };
      },
    }
  )
);

// Safe hook that always returns valid state
export const useThemeStoreSafe = () => {
  try {
    const store = useThemeStore();
    if (!store || !store.isHydrated) {
      return defaultState;
    }
    return store;
  } catch (error) {
    console.warn('Error accessing theme store:', error);
    return defaultState;
  }
};

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__themeStore = useThemeStore;
}