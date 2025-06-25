import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => {
        try {
          set({ theme });
        } catch (error) {
          console.warn('Error setting theme:', error);
        }
      },
      toggleTheme: () => {
        try {
          const currentState = get();
          const currentTheme = currentState?.theme || 'dark';
          set({ theme: currentTheme === 'dark' ? 'light' : 'dark' });
        } catch (error) {
          console.warn('Error toggling theme:', error);
          set({ theme: 'dark' });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure we always have a valid theme and functions
        if (!state) {
          return { 
            theme: 'dark' as Theme, 
            setTheme: (theme: Theme) => {
              try {
                useThemeStore.setState({ theme });
              } catch (error) {
                console.warn('Error setting theme:', error);
              }
            }, 
            toggleTheme: () => {
              try {
                const currentTheme = useThemeStore.getState()?.theme || 'dark';
                useThemeStore.setState({ theme: currentTheme === 'dark' ? 'light' : 'dark' });
              } catch (error) {
                console.warn('Error toggling theme:', error);
                useThemeStore.setState({ theme: 'dark' });
              }
            }
          };
        }
        
        // Ensure functions exist even after rehydration
        if (!state.setTheme || !state.toggleTheme) {
          return {
            ...state,
            theme: state.theme || 'dark',
            setTheme: (theme: Theme) => {
              try {
                useThemeStore.setState({ theme });
              } catch (error) {
                console.warn('Error setting theme:', error);
              }
            },
            toggleTheme: () => {
              try {
                const currentTheme = useThemeStore.getState()?.theme || 'dark';
                useThemeStore.setState({ theme: currentTheme === 'dark' ? 'light' : 'dark' });
              } catch (error) {
                console.warn('Error toggling theme:', error);
                useThemeStore.setState({ theme: 'dark' });
              }
            }
          };
        }
        
        return state;
      },
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__themeStore = useThemeStore;
}