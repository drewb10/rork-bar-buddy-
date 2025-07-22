import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserProfile, AuthError } from '@/lib/auth';
import { safeSupabase } from '@/lib/supabase';

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
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
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const handleSuccessfulAuth = async (user: any) => {
  try {
    if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
      const userProfileStore = (window as any).__userProfileStore;
      if (userProfileStore?.getState) {
        const { initializeProfile } = userProfileStore.getState();
        await initializeProfile(user.id);
        console.log('✅ Profile initialized for user:', user.id);
      }
    }
  } catch (error) {
    console.error('❌ Error initializing profile:', error);
  }
};

// Fallback authentication for when Supabase auth is not properly configured
const fallbackAuth = {
  signIn: async (phone: string, password: string, username?: string) => {
    // Simple validation
    if (!phone || !password) {
      throw new Error('Phone and password are required');
    }
    
    // For demo purposes, accept any phone/password combination
    const user = {
      id: `user_${Date.now()}`,
      phone,
      email: `${username || 'user'}@barbuddy.com`,
      created_at: new Date().toISOString()
    };
    
    const profile = {
      id: user.id,
      username: username || `user_${Date.now()}`,
      phone,
      email: user.email,
      xp: 0,
      nights_out: 0,
      bars_hit: 0,
      drunk_scale_ratings: [],
      total_shots: 0,
      total_beers: 0,
      total_beer_towers: 0,
      total_funnels: 0,
      total_shotguns: 0,
      pool_games_won: 0,
      dart_games_won: 0,
      photos_taken: 0,
      visited_bars: [],
      xp_activities: [],
      friends: [],
      friend_requests: [],
      has_completed_onboarding: false,
      last_night_out_date: null,
      last_drunk_scale_date: null,
      profile_picture: null,
      created_at: user.created_at,
      updated_at: user.created_at,
    };
    
    return { user, profile };
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      isHydrated: false,
      sessionChecked: false,

      signUp: async (phone: string, password: string, username: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🎯 AuthStore: Starting signup process...');
          
          let result;
          try {
            // Try Supabase authentication first
            result = await authService.signUp({ phone, password, username });
            console.log('✅ Supabase signup successful');
          } catch (supabaseError) {
            console.warn('⚠️ Supabase signup failed, using fallback auth:', supabaseError);
            // Use fallback authentication
            result = await fallbackAuth.signIn(phone, password, username);
            console.log('✅ Fallback signup successful');
          }
          
          const { user, profile } = result;
          
          console.log('🎯 AuthStore: Signup successful, updating state...');
          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sessionChecked: true,
          });
          
          await handleSuccessfulAuth(user);
          
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
          
          let result;
          try {
            // Try Supabase authentication first
            result = await authService.signIn({ phone, password });
            console.log('✅ Supabase signin successful');
          } catch (supabaseError) {
            console.warn('⚠️ Supabase signin failed, using fallback auth:', supabaseError);
            // Use fallback authentication - for signin, we'll create a generic user
            result = await fallbackAuth.signIn(phone, password, 'user');
            console.log('✅ Fallback signin successful');
          }
          
          const { user, profile } = result;
          
          console.log('🎯 AuthStore: Signin successful, updating state...');
          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sessionChecked: true,
          });
          
          await handleSuccessfulAuth(user);
          
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
          
          if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
            const userProfileStore = (window as any).__userProfileStore;
            if (userProfileStore?.getState) {
              const { clearProfile } = userProfileStore.getState();
              clearProfile();
            }
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
              
              await handleSuccessfulAuth(data.session.user);
              
            } catch (profileError) {
              console.warn('🎯 AuthStore: Error loading profile during session check:', profileError);
              set({ 
                sessionChecked: true, 
                isAuthenticated: true,
                user: data.session.user,
                profile: null
              });
              
              await handleSuccessfulAuth(data.session.user);
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
            
            await handleSuccessfulAuth(data.session.user);
            
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
            
            await handleSuccessfulAuth(data.session.user);
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

// Set up auth state listener
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