import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        id: '1',
        email: 'user@barbuddy.com',
        firstName: 'Bar',
        lastName: 'Buddy'
      },
      isAuthenticated: true,
      
      signIn: async (email: string, password: string) => {
        // Mock sign in - in real app this would call an API
        const user = {
          id: '1',
          email,
          firstName: 'Bar',
          lastName: 'Buddy'
        };
        set({ user, isAuthenticated: true });
      },
      
      signOut: () => {
        // Only clear auth data, NOT user stats
        set({ user: null, isAuthenticated: false });
        // Note: We deliberately don't clear userProfileStore data here
        // Stats should persist across login sessions
      },
      
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist auth-related data
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);