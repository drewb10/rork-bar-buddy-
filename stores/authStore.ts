import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserProfile, AuthError } from '@/lib/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isConfigured: boolean;
  
  // Actions
  signUp: (phone: string, password: string, username: string) => Promise<boolean>;
  signIn: (phone: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  searchUser: (username: string) => Promise<UserProfile | null>;
  initialize: () => Promise<void>;
  checkConfiguration: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      isConfigured: isSupabaseConfigured(),

      signUp: async (phone: string, password: string, username: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
          set({ error: 'Authentication not configured' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          console.log('🎯 AuthStore: Starting signup process...');
          const { user, profile } = await authService.signUp({ phone, password, username });
          
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

      signIn: async (phone: string, password: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
          set({ error: 'Authentication not configured' });
          return false;
        }

        set({ isLoading: true, error: null });
        
        try {
          console.log('🎯 AuthStore: Starting signin process...');
          const { user, profile } = await authService.signIn({ phone, password });
          
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
          if (isSupabaseConfigured()) {
            await authService.signOut();
          }
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
        if (!isSupabaseConfigured()) return true;

        try {
          return await authService.checkUsernameAvailable(username);
        } catch (error) {
          console.error('Error checking username:', error);
          return false;
        }
      },

      updateProfile: async (updates: Partial<UserProfile>): Promise<boolean> => {
        if (!isSupabaseConfigured()) return false;

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
        if (!isSupabaseConfigured()) return null;

        try {
          return await authService.searchUserByUsername(username);
        } catch (error) {
          console.error('Error searching user:', error);
          return null;
        }
      },

      initialize: async (): Promise<void> => {
        // Check configuration first
        const configured = isSupabaseConfigured();
        set({ isConfigured: configured });
        
        if (!configured) {
          console.log('🎯 AuthStore: Supabase not configured, skipping auth initialization');
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          return;
        }
        
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
      },

      checkConfiguration: () => {
        const configured = isSupabaseConfigured();
        set({ isConfigured: configured });
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

// Set up auth state listener only if configured
if (isSupabaseConfigured()) {
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
} else {
  console.warn('🎯 Supabase not configured, skipping auth state listener');
}