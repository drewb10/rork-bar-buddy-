import { supabase, isSupabaseConfigured } from './supabase';

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
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping username check');
        return true; // Allow any username when not configured
      }

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
        console.error('❌ Error checking username availability:', error);
        return false;
      }
      
      return !data;
    } catch (error) {
      console.error('❌ Error checking username availability:', error);
      return false;
    }
  },

  async signUp({ email, password, username }: SignUpData): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      if (!isSupabaseConfigured()) {
        throw new AuthError('Database not configured. Please check your setup instructions.', 'NOT_CONFIGURED');
      }

      console.log('🚀 AuthService: Starting signup process for:', { email, username });
      
      // Step 1: Check username availability
      console.log('📝 AuthService: Checking username availability...');
      const isAvailable = await this.checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new AuthError('Username is already taken', 'USERNAME_TAKEN');
      }
      console.log('✅ AuthService: Username is available');

      // Step 2: Create auth user
      console.log('📝 AuthService: Creating auth user...');
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
        console.error('❌ AuthService: Auth signup error:', authError);
        
        // Provide more specific error messages
        if (authError.message.includes('already registered')) {
          throw new AuthError('An account with this email already exists', 'EMAIL_TAKEN');
        }
        if (authError.message.includes('Database error')) {
          throw new AuthError('Database connection issue. Please check your Supabase configuration.', 'DATABASE_ERROR');
        }
        if (authError.message.includes('Invalid email')) {
          throw new AuthError('Please enter a valid email address', 'INVALID_EMAIL');
        }
        if (authError.message.includes('Password')) {
          throw new AuthError('Password must be at least 6 characters long', 'WEAK_PASSWORD');
        }
        
        throw new AuthError(authError.message, authError.message);
      }

      if (!authData.user) {
        console.error('❌ AuthService: No user returned from auth signup');
        throw new AuthError('Failed to create user account', 'SIGNUP_FAILED');
      }

      console.log('✅ AuthService: Auth user created successfully:', authData.user.id);

      // Step 3: Create profile manually
      console.log('📝 AuthService: Creating user profile manually...');
      
      try {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
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
          console.error('❌ AuthService: Profile creation error:', profileError);
          throw new AuthError('Failed to create user profile. Please try again.', 'PROFILE_CREATION_FAILED');
        }

        console.log('✅ AuthService: Profile created successfully:', newProfile.id);
        console.log('🎉 AuthService: Signup completed successfully for user:', authData.user.id);

        return { user: authData.user, profile: newProfile };
      } catch (profileError) {
        console.error('❌ AuthService: Exception during profile creation:', profileError);
        throw new AuthError('Failed to create user profile. Please try again.', 'PROFILE_CREATION_FAILED');
      }
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('❌ AuthService: Unexpected signup error:', error);
      throw new AuthError('Failed to create account. Please try again.', 'SIGNUP_FAILED');
    }
  },

  async signIn({ email, password }: SignInData): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      if (!isSupabaseConfigured()) {
        throw new AuthError('Database not configured. Please check your setup instructions.', 'NOT_CONFIGURED');
      }

      console.log('🚀 AuthService: Starting signin process for:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('❌ AuthService: Auth signin error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        throw new AuthError(authError.message, authError.message);
      }

      if (!authData.user) {
        console.error('❌ AuthService: No user returned from auth signin');
        throw new AuthError('Failed to sign in', 'SIGNIN_FAILED');
      }

      console.log('✅ AuthService: Auth signin successful:', authData.user.id);

      // Get user profile
      console.log('📝 AuthService: Loading user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('❌ AuthService: Profile load error:', profileError);
        throw new AuthError('Failed to load user profile', 'PROFILE_LOAD_FAILED');
      }

      console.log('✅ AuthService: Profile loaded successfully:', profile.id);
      console.log('🎉 AuthService: Signin completed successfully for user:', authData.user.id);

      return { user: authData.user, profile };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('❌ AuthService: Unexpected signin error:', error);
      throw new AuthError('Failed to sign in. Please try again.', 'SIGNIN_FAILED');
    }
  },

  async signOut(): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping signout');
        return;
      }

      console.log('🚀 AuthService: Starting signout process...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ AuthService: Signout error:', error);
        throw new AuthError(error.message, error.message);
      }
      console.log('✅ AuthService: Signout successful');
    } catch (error) {
      console.error('❌ AuthService: Signout error:', error);
      throw new AuthError('Failed to sign out', 'SIGNOUT_FAILED');
    }
  },

  async getCurrentUser(): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, returning null user');
        return { user: null, profile: null };
      }

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
      if (!isSupabaseConfigured()) {
        throw new AuthError('Database not configured', 'NOT_CONFIGURED');
      }

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
      if (!isSupabaseConfigured()) {
        return null;
      }

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