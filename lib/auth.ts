import { safeSupabase, isSupabaseConfigured } from './supabase';

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  email?: string | null;
  xp: number;
  nights_out: number;
  bars_hit: number;
  drunk_scale_ratings: number[];
  last_night_out_date?: string;
  last_drunk_scale_date?: string;
  profile_picture?: string;
  friends: any[];
  friend_requests: any[];
  xp_activities: any[];
  visited_bars: string[];
  total_shots: number;
  total_beers: number;
  total_beer_towers: number;
  total_funnels: number;
  total_shotguns: number;
  pool_games_won: number;
  dart_games_won: number;
  photos_taken: number;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authService = {
  signUp: async ({ phone, password, username }: { phone: string; password: string; username: string }) => {
    if (!isSupabaseConfigured()) {
      throw new AuthError('Authentication not configured');
    }

    try {
      const { data, error } = await safeSupabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            username,
          }
        }
      });

      if (error) throw new AuthError(error.message);
      if (!data.user) throw new AuthError('Failed to create user');

      // Create profile
      const profileData = {
        id: data.user.id,
        username,
        phone,
        email: data.user.email,
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
      };

      const { data: profile, error: profileError } = await safeSupabase
        .from('profiles')
        .insert(profileData)
        .select('*')
        .single();

      if (profileError) {
        console.warn('Failed to create profile:', profileError);
      }

      return {
        user: data.user,
        profile: profile || profileData
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(error instanceof Error ? error.message : 'Sign up failed');
    }
  },

  signIn: async ({ phone, password }: { phone: string; password: string }) => {
    if (!isSupabaseConfigured()) {
      throw new AuthError('Authentication not configured');
    }

    try {
      const { data, error } = await safeSupabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) throw new AuthError(error.message);
      if (!data.user) throw new AuthError('Failed to sign in');

      // Get profile
      const { data: profile } = await safeSupabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return {
        user: data.user,
        profile
      };
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(error instanceof Error ? error.message : 'Sign in failed');
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured()) {
      return; // Gracefully handle when not configured
    }

    const { error } = await safeSupabase.auth.signOut();
    if (error) throw new AuthError(error.message);
  },

  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) {
      throw new AuthError('Authentication not configured');
    }

    const { data: { user }, error } = await safeSupabase.auth.getUser();
    if (error) throw new AuthError(error.message);
    if (!user) throw new AuthError('No authenticated user');

    const { data: profile } = await safeSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile };
  },

  checkUsernameAvailable: async (username: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      return true; // Assume available if not configured
    }

    const { data } = await safeSupabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    return !data;
  },

  updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (!isSupabaseConfigured()) {
      throw new AuthError('Profile updates not available - authentication not configured');
    }

    const { data: { user } } = await safeSupabase.auth.getUser();
    if (!user) throw new AuthError('No authenticated user');

    const { data, error } = await safeSupabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) throw new AuthError(error.message);
    return data;
  },

  searchUserByUsername: async (username: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data } = await safeSupabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    return data;
  }
};