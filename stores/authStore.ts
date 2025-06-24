import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signUp: (username: string, password: string, firstName: string, lastName: string) => Promise<boolean>;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      signUp: async (username: string, password: string, firstName: string, lastName: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Validate inputs
          if (!username.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
            set({ error: 'All fields are required', isLoading: false });
            return false;
          }
          
          if (username.length < 3) {
            set({ error: 'Username must be at least 3 characters long', isLoading: false });
            return false;
          }
          
          if (password.length < 6) {
            set({ error: 'Password must be at least 6 characters long', isLoading: false });
            return false;
          }
          
          // Check username availability
          const isAvailable = await get().checkUsernameAvailability(username);
          if (!isAvailable) {
            set({ error: 'Username is already taken. Please choose another.', isLoading: false });
            return false;
          }
          
          // Create email from username for Supabase auth
          const email = `${username.toLowerCase()}@barbuddy.local`;
          
          // Sign up with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username: username.toLowerCase(),
                first_name: firstName,
                last_name: lastName,
              }
            }
          });
          
          if (authError) {
            set({ error: authError.message, isLoading: false });
            return false;
          }
          
          if (!authData.user) {
            set({ error: 'Failed to create account', isLoading: false });
            return false;
          }
          
          // Create user profile in our custom table
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              username: username.toLowerCase(),
              first_name: firstName,
              last_name: lastName,
              email: email,
              has_completed_onboarding: true,
              xp: 0,
              xp_activities: [],
              visited_bars: [],
              events_attended: 0,
              friends_referred: 0,
              live_events_attended: 0,
              featured_drinks_tried: 0,
              bar_games_played: 0,
            });
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Continue anyway, profile can be created later
          }
          
          const user: User = {
            id: authData.user.id,
            email,
            username: username.toLowerCase(),
            firstName,
            lastName,
          };
          
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
          
        } catch (error) {
          console.error('Sign up error:', error);
          set({ error: 'Failed to create account. Please try again.', isLoading: false });
          return false;
        }
      },
      
      signIn: async (username: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          if (!username.trim() || !password.trim()) {
            set({ error: 'Username and password are required', isLoading: false });
            return false;
          }
          
          // Create email from username
          const email = `${username.toLowerCase()}@barbuddy.local`;
          
          // Sign in with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (authError) {
            set({ error: 'Invalid username or password', isLoading: false });
            return false;
          }
          
          if (!authData.user) {
            set({ error: 'Failed to sign in', isLoading: false });
            return false;
          }
          
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('username, first_name, last_name, email')
            .eq('user_id', authData.user.id)
            .single();
          
          if (profileError || !profileData) {
            // Create profile if it doesn't exist
            const userData = authData.user.user_metadata;
            const user: User = {
              id: authData.user.id,
              email,
              username: userData.username || username.toLowerCase(),
              firstName: userData.first_name || 'User',
              lastName: userData.last_name || 'Name',
            };
            
            set({ user, isAuthenticated: true, isLoading: false });
            return true;
          }
          
          const user: User = {
            id: authData.user.id,
            email: profileData.email || email,
            username: profileData.username,
            firstName: profileData.first_name,
            lastName: profileData.last_name,
          };
          
          set({ user, isAuthenticated: true, isLoading: false });
          return true;
          
        } catch (error) {
          console.error('Sign in error:', error);
          set({ error: 'Failed to sign in. Please try again.', isLoading: false });
          return false;
        }
      },
      
      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false, error: null });
        } catch (error) {
          console.error('Sign out error:', error);
          set({ user: null, isAuthenticated: false, error: null });
        }
      },
      
      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      checkUsernameAvailability: async (username: string): Promise<boolean> => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('username', username.toLowerCase())
            .single();
          
          // If no data found, username is available
          // If error code is PGRST116, it means no rows found (available)
          return !data || error?.code === 'PGRST116';
        } catch (error) {
          console.error('Username check error:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);