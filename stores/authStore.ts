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
  isHydrated: boolean;
  sessionChecked: boolean;
  
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
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<boolean>;
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
      isHydrated: false,
      sessionChecked: false,

      signUp: async (phone: string, password: string, username: string): Promise<boolean> => {
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
            error: null,
            sessionChecked: true,
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
            isAuthenticated: false,
            sessionChecked: true,
          });
          return false;
        }
      },

      signIn: async (phone: string, password: string): Promise<boolean> => {
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
            error: null,
            sessionChecked: true,
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
            isAuthenticated: false,
            sessionChecked: true,
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
            error: null,
            sessionChecked: true,
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
            error: null,
            sessionChecked: true,
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

      refreshSession: async (): Promise<void> => {
        if (!isSupabaseConfigured()) {
          console.log('🎯 AuthStore: Supabase not configured, skipping session refresh');
          return;
        }

        try {
          console.log('🎯 AuthStore: Refreshing session...');
          const { data: { session }, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error('🎯 AuthStore: Session refresh failed:', error);
            // Clear auth state if refresh fails
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              error: null,
              sessionChecked: true,
            });
            return;
          }

          if (session?.user) {
            console.log('🎯 AuthStore: Session refreshed successfully');
            // Re-initialize with fresh session
            await get().initialize();
          }
        } catch (error) {
          console.error('🎯 AuthStore: Session refresh error:', error);
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            error: null,
            sessionChecked: true,
          });
        }
      },

      checkSession: async (): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
          console.log('🎯 AuthStore: Supabase not configured');
          set({ sessionChecked: true, isAuthenticated: false });
          return false;
        }

        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('🎯 AuthStore: Session check error:', error);
            set({ 
              sessionChecked: true, 
              isAuthenticated: false,
              user: null,
              profile: null 
            });
            return false;
          }

          const isValid = !!session?.user;
          console.log('🎯 AuthStore: Session check result:', isValid);
          
          if (isValid && session?.user) {
            // If we have a valid session but no profile loaded, initialize
            const currentState = get();
            if (!currentState.profile) {
              await get().initialize();
            } else {
              set({ 
                sessionChecked: true, 
                isAuthenticated: true,
                user: session.user 
              });
            }
          } else {
            set({ 
              sessionChecked: true, 
              isAuthenticated: false,
              user: null,
              profile: null 
            });
          }

          return isValid;
        } catch (error) {
          console.error('🎯 AuthStore: Session check failed:', error);
          set({ 
            sessionChecked: true, 
            isAuthenticated: false,
            user: null,
            profile: null 
          });
          return false;
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
            error: null,
            sessionChecked: true,
          });
          return;
        }
        
        set({ isLoading: true });
        
        try {
          console.log('🎯 AuthStore: Initializing auth state...');
          
          // First check if we have a valid session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('🎯 AuthStore: Session error:', sessionError);
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              sessionChecked: true,
            });
            return;
          }

          if (!session?.user) {
            console.log('🎯 AuthStore: No valid session found');
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              sessionChecked: true,
            });
            return;
          }

          // If session exists, get current user and profile
          const { user, profile } = await authService.getCurrentUser();
          
          if (user && profile) {
            console.log('🎯 AuthStore: Found existing session with profile');
            set({
              user,
              profile,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              sessionChecked: true,
            });
          } else {
            console.log('🎯 AuthStore: Session exists but no profile found');
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              sessionChecked: true,
            });
          }
        } catch (error) {
          console.error('🎯 AuthStore: Auth initialization error:', error);
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            sessionChecked: true,
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
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Error rehydrating auth store:', error);
        }
        
        return { ...state, isHydrated: true };
      },
    }
  )
);

// Set up auth state listener only if configured
if (isSupabaseConfigured()) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🎯 Auth state change:', event);
    const { initialize, refreshSession } = useAuthStore.getState();
    
    if (event === 'SIGNED_IN' && session) {
      await initialize();
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({
        user: null,
        profile: null,
        isAuthenticated: false,
        error: null,
        sessionChecked: true,
      });
    } else if (event === 'TOKEN_REFRESHED' && session) {
      console.log('🎯 Token refreshed, updating state...');
      await initialize();
    }
  });
} else {
  console.warn('🎯 Supabase not configured, skipping auth state listener');
}