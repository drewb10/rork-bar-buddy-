import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserProfile, AuthError } from '@/lib/auth';
import { safeSupabase, isSupabaseConfigured } from '@/lib/supabase';

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
          
          if (!isSupabaseConfigured()) {
            throw new Error('Authentication not configured');
          }
          
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
          
          if (!isSupabaseConfigured()) {
            throw new Error('Authentication not configured');
          }
          
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
          
          if (isSupabaseConfigured()) {
            await authService.signOut();
          }
          
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
          if (!isSupabaseConfigured()) return true;
          return await authService.checkUsernameAvailable(username);
        } catch (error) {
          console.error('Error checking username:', error);
          return false;
        }
      },

      updateProfile: async (updates: Partial<UserProfile>): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          if (!isSupabaseConfigured()) {
            throw new Error('Profile updates not available - authentication not configured');
          }
          
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
          if (!isSupabaseConfigured()) return null;
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
          const { data, error } = await safeSupabase.auth.refreshSession();
          
          if (error) {
            console.warn('🎯 AuthStore: Session refresh failed:', error.message);
            return;
          }

          if (data?.session?.user) {
            console.log('🎯 AuthStore: Session refreshed successfully');
            set({ 
              user: data.session.user,
              isAuthenticated: true 
            });
          }
        } catch (error) {
          console.warn('🎯 AuthStore: Session refresh error:', error);
        }
      },

      checkSession: async (): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
          console.log('🎯 AuthStore: Supabase not configured');
          set({ sessionChecked: true, isAuthenticated: false });
          return false;
        }

        try {
          console.log('🎯 AuthStore: Checking session...');
          const { data, error } = await safeSupabase.auth.getSession();
          
          if (error) {
            console.warn('🎯 AuthStore: Session check error:', error.message);
            set({ sessionChecked: true, isAuthenticated: false });
            return false;
          }

          const isValid = !!data?.session?.user;
          console.log('🎯 AuthStore: Session check result:', isValid);
          
          if (isValid && data?.session?.user) {
            try {
              const { user, profile } = await authService.getCurrentUser();
              set({ 
                sessionChecked: true, 
                isAuthenticated: true,
                user: user || data.session.user,
                profile: profile
              });
            } catch (profileError) {
              console.warn('🎯 AuthStore: Error loading profile during session check:', profileError);
              set({ 
                sessionChecked: true, 
                isAuthenticated: true,
                user: data.session.user,
                profile: null
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
          console.warn('🎯 AuthStore: Session check failed:', error);
          set({ sessionChecked: true, isAuthenticated: false });
          return false;
        }
      },

      initialize: async (): Promise<void> => {
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
          
          const { data, error: sessionError } = await safeSupabase.auth.getSession();
          
          if (sessionError) {
            console.warn('🎯 AuthStore: Session error:', sessionError.message);
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

          if (!data?.session?.user) {
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

          try {
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
                user: data.session.user,
                profile: null,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                sessionChecked: true,
              });
            }
          } catch (profileError) {
            console.warn('🎯 AuthStore: Error loading profile during initialization:', profileError);
            set({
              user: data.session.user,
              profile: null,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              sessionChecked: true,
            });
          }
        } catch (error) {
          console.warn('🎯 AuthStore: Auth initialization error:', error);
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
        sessionChecked: state.sessionChecked,
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
  try {
    safeSupabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('🎯 Auth state change:', event);
      const { initialize } = useAuthStore.getState();
      
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
        useAuthStore.setState({
          user: session.user,
          isAuthenticated: true,
        });
      }
    });
  } catch (error) {
    console.warn('🎯 Error setting up auth state listener:', error);
  }
} else {
  console.warn('🎯 Supabase not configured, skipping auth state listener');
}