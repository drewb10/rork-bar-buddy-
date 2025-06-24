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
      // First check if username is valid
      if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return false;
      }
      
      // Check if username exists in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking username availability:', error);
        return false;
      }
      
      return !data;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  },

  async signUp({ email, password, username }: SignUpData): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      console.log('🚀 Starting signup process for:', { email, username });
      
      // First check if username is available
      const isAvailable = await this.checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new AuthError('Username is already taken', 'USERNAME_TAKEN');
      }

      // Step 1: Sign up with Supabase Auth
      console.log('📝 Creating auth user...');
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
        console.error('❌ Auth signup error:', authError);
        if (authError.message.includes('already registered')) {
          throw new AuthError('An account with this email already exists', 'EMAIL_TAKEN');
        }
        throw new AuthError(authError.message, authError.message);
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signup');
        throw new AuthError('Failed to create user account', 'SIGNUP_FAILED');
      }

      console.log('✅ Auth user created successfully:', authData.user.id);

      // Step 2: Create profile record with matching user ID
      console.log('📝 Creating profile record...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,  // 🔑 CRITICAL: Must match auth.users.id
          username,
          email,
          xp: 0,
          nights_out: 0,
          bars_hit: 0,
          drunk_scale_ratings: [],
          total_shots: 0,
          total_scoop_and_scores: 0,
          total_beers: 0,
          total_beer_towers: 0,
          total_funnels: 0,
          total_shotguns: 0,
          pool_games_won: 0,
          dart_games_won: 0,
          photos_taken: 0,
          visited_bars: [],
          xp_activities: [],
          has_completed_onboarding: false
        })
        .select('*')
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        console.error('Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        
        // CRITICAL: Clean up the auth user if profile creation fails
        console.log('🧹 Cleaning up auth user due to profile creation failure...');
        try {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
          if (deleteError) {
            console.error('❌ Failed to cleanup auth user:', deleteError);
          } else {
            console.log('✅ Auth user cleaned up successfully');
          }
        } catch (cleanupError) {
          console.error('❌ Exception during auth user cleanup:', cleanupError);
        }
        
        throw new AuthError('Failed to create user profile. Please try again.', 'PROFILE_CREATION_FAILED');
      }

      console.log('✅ Profile created successfully:', profile.id);
      console.log('🎉 Signup completed successfully for user:', authData.user.id);

      return { user: authData.user, profile };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('❌ Unexpected signup error:', error);
      throw new AuthError('Failed to create account. Please try again.', 'SIGNUP_FAILED');
    }
  },

  async signIn({ email, password }: SignInData): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      console.log('🚀 Starting signin process for:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('❌ Auth signin error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        throw new AuthError(authError.message, authError.message);
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signin');
        throw new AuthError('Failed to sign in', 'SIGNIN_FAILED');
      }

      console.log('✅ Auth signin successful:', authData.user.id);

      // Get user profile
      console.log('📝 Loading user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile load error:', profileError);
        throw new AuthError('Failed to load user profile', 'PROFILE_LOAD_FAILED');
      }

      console.log('✅ Profile loaded successfully:', profile.id);
      console.log('🎉 Signin completed successfully for user:', authData.user.id);

      return { user: authData.user, profile };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('❌ Unexpected signin error:', error);
      throw new AuthError('Failed to sign in. Please try again.', 'SIGNIN_FAILED');
    }
  },

  async signOut(): Promise<void> {
    try {
      console.log('🚀 Starting signout process...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Signout error:', error);
        throw new AuthError(error.message, error.message);
      }
      console.log('✅ Signout successful');
    } catch (error) {
      console.error('❌ Signout error:', error);
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
        console.error('Profile update error:', error);
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