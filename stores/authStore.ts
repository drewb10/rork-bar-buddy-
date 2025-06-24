import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserProfile, AuthError } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  signUp: (email: string, password: string, username: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  searchUser: (username: string) => Promise<UserProfile | null>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      signUp: async (email: string, password: string, username: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🎯 AuthStore: Starting signup process...');
          const { user, profile } = await authService.signUp({ email, password, username });
          
          console.log('🎯 AuthStore: Signup successful, updating state...');
          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          console.log('🎯 AuthStore: State updated successfully');
          return true;
        } catch (error) {
          console.error('🎯 AuthStore: Signup failed:', error);
          const errorMessage = error instanceof AuthError ? error.message : 'Failed to create account';
          set({ 
            error: errorMessage, 
            isLoading: false,
            user: null,
            profile: null,
            isAuthenticated: false
          });
          return false;
        }
      },

      signIn: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🎯 AuthStore: Starting signin process...');
          const { user, profile } = await authService.signIn({ email, password });
          
          console.log('🎯 AuthStore: Signin successful, updating state...');
          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          console.log('🎯 AuthStore: State updated successfully');
          return true;
        } catch (error) {
          console.error('🎯 AuthStore: Signin failed:', error);
          const errorMessage = error instanceof AuthError ? error.message : 'Failed to sign in';
          set({ 
            error: errorMessage, 
            isLoading: false,
            user: null,
            profile: null,
            isAuthenticated: false
          });
          return false;
        }
      },

      signOut: async (): Promise<void> => {
        set({ isLoading: true });
        
        try {
          console.log('🎯 AuthStore: Starting signout process...');
          await authService.signOut();
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          console.log('🎯 AuthStore: Signout successful');
        } catch (error) {
          console.error('🎯 AuthStore: Signout error:', error);
          // Force sign out locally even if server call fails
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      checkUsernameAvailable: async (username: string): Promise<boolean> => {
        try {
          return await authService.checkUsernameAvailable(username);
        } catch (error) {
          console.error('Error checking username:', error);
          return false;
        }
      },

      updateProfile: async (updates: Partial<UserProfile>): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedProfile = await authService.updateProfile(updates);
          set({
            profile: updatedProfile,
            isLoading: false,
            error: null
          });
          return true;
        } catch (error) {
          const errorMessage = error instanceof AuthError ? error.message : 'Failed to update profile';
          set({ 
            error: errorMessage, 
            isLoading: false
          });
          return false;
        }
      },

      searchUser: async (username: string): Promise<UserProfile | null> => {
        try {
          return await authService.searchUserByUsername(username);
        } catch (error) {
          console.error('Error searching user:', error);
          return null;
        }
      },

      initialize: async (): Promise<void> => {
        set({ isLoading: true });
        
        try {
          console.log('🎯 AuthStore: Initializing auth state...');
          const { user, profile } = await authService.getCurrentUser();
          
          if (user && profile) {
            console.log('🎯 AuthStore: Found existing session');
            set({
              user,
              profile,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            console.log('🎯 AuthStore: No existing session');
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          }
        } catch (error) {
          console.error('🎯 AuthStore: Auth initialization error:', error);
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Set up auth state listener
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🎯 Auth state change:', event);
  const { initialize } = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session) {
    await initialize();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      error: null
    });
  }
});