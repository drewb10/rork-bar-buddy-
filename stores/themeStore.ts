import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Theme } from '@/constants/colors';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Safe hook that handles cases where the store might not be initialized
export const useThemeStoreSafe = () => {
  try {
    const store = useThemeStore();
    
    return {
      theme: store?.theme || 'dark',
      setTheme: store?.setTheme || (() => {}),
      toggleTheme: store?.toggleTheme || (() => {}),
    };
  } catch (error) {
    console.warn('Error accessing theme store safely:', error);
    
    return {
      theme: 'dark' as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
};