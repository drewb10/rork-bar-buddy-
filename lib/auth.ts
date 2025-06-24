import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  xp: number;
  nights_out: number;
  bars_hit: number;
  drunk_scale_ratings: number[];
  total_shots: number;
  total_scoop_and_scores: number;
  total_beers: number;
  total_beer_towers: number;
  total_funnels: number;
  total_shotguns: number;
  pool_games_won: number;
  dart_games_won: number;
  photos_taken: number;
  profile_picture?: string;
  visited_bars: string[];
  xp_activities: any[];
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authService = {
  async checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      return !data;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  },

  async signUp({ email, password, username }: SignUpData): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      // First check if username is available
      const isAvailable = await this.checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new AuthError('Username is already taken', 'USERNAME_TAKEN');
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new AuthError('An account with this email already exists', 'EMAIL_TAKEN');
        }
        throw new AuthError(authError.message, authError.message);
      }

      if (!authData.user) {
        throw new AuthError('Failed to create user account', 'SIGNUP_FAILED');
      }

      // Get the created profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('Profile not found immediately after signup:', profileError);
        
        // Create profile manually if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username,
            email,
            has_completed_onboarding: false
          })
          .select('*')
          .single();
          
        if (createError) {
          console.error('Failed to create profile:', createError);
        }
        
        return { user: authData.user, profile: newProfile || null };
      }

      return { user: authData.user, profile };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('Signup error:', error);
      throw new AuthError('Failed to create account. Please try again.', 'SIGNUP_FAILED');
    }
  },

  async signIn({ email, password }: SignInData): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        throw new AuthError(authError.message, authError.message);
      }

      if (!authData.user) {
        throw new AuthError('Failed to sign in', 'SIGNIN_FAILED');
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new AuthError('Failed to load user profile', 'PROFILE_LOAD_FAILED');
      }

      return { user: authData.user, profile };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('Signin error:', error);
      throw new AuthError('Failed to sign in. Please try again.', 'SIGNIN_FAILED');
    }
  },

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new AuthError(error.message, error.message);
      }
    } catch (error) {
      console.error('Signout error:', error);
      throw new AuthError('Failed to sign out', 'SIGNOUT_FAILED');
    }
  },

  async getCurrentUser(): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { user: null, profile: null };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Error fetching profile for current user:', profileError);
        return { user, profile: null };
      }

      return { user, profile };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { user: null, profile: null };
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new AuthError('Not authenticated', 'NOT_AUTHENTICATED');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw new AuthError('Failed to update profile', 'UPDATE_FAILED');
      }

      return data;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('Profile update error:', error);
      throw new AuthError('Failed to update profile', 'UPDATE_FAILED');
    }
  },

  async searchUserByUsername(username: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error searching user:', error);
      return null;
    }
  }
};