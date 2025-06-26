import { supabase, isSupabaseConfigured } from './supabase';

export interface SignUpData {
  phone: string;
  password: string;
  username: string;
}

export interface SignInData {
  phone: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  email?: string | null;
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
  daily_stats: any;
  last_night_out_date?: string;
  last_drunk_scale_date?: string;
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
        return true;
      }

      if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return false;
      }
      
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

  async signUp({ phone, password, username }: SignUpData): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      if (!isSupabaseConfigured()) {
        throw new AuthError('Database not configured. Please check your setup instructions.', 'NOT_CONFIGURED');
      }

      console.log('🚀 AuthService: Starting signup process for:', { phone, username });
      
      // Step 1: Check username availability
      console.log('📝 AuthService: Checking username availability...');
      const isAvailable = await this.checkUsernameAvailable(username);
      if (!isAvailable) {
        throw new AuthError('Username is already taken', 'USERNAME_TAKEN');
      }
      console.log('✅ AuthService: Username is available');

      // Step 2: Create auth user with phone
      console.log('📝 AuthService: Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) {
        console.error('❌ AuthService: Auth signup error:', authError);
        
        if (authError.message.includes('User already registered')) {
          throw new AuthError('An account with this phone number already exists', 'PHONE_TAKEN');
        }
        if (authError.message.includes('Database error saving new user')) {
          throw new AuthError('Database setup issue. Please run the latest migration (20250625013000_fix_schema_cache_final.sql) in your Supabase dashboard.', 'DATABASE_ERROR');
        }
        if (authError.message.includes('Invalid phone')) {
          throw new AuthError('Please enter a valid phone number', 'INVALID_PHONE');
        }
        if (authError.message.includes('Password should be at least')) {
          throw new AuthError('Password must be at least 6 characters long', 'WEAK_PASSWORD');
        }
        if (authError.message.includes('signup is disabled')) {
          throw new AuthError('Account creation is currently disabled. Please contact support.', 'SIGNUP_DISABLED');
        }
        
        throw new AuthError(`Authentication failed: ${authError.message}`, 'AUTH_ERROR');
      }

      if (!authData.user) {
        console.error('❌ AuthService: No user returned from auth signup');
        throw new AuthError('Failed to create user account', 'SIGNUP_FAILED');
      }

      console.log('✅ AuthService: Auth user created successfully:', authData.user.id);

      // Step 3: Create profile with phone-first logic
      console.log('📝 AuthService: Creating user profile...');
      
      const profileData = {
        id: authData.user.id,
        username,
        phone: authData.user.phone || phone,
        email: authData.user.email || null,
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
        has_completed_onboarding: false,
        daily_stats: {}
      };
      
      // Retry profile creation up to 3 times
      let profile = null;
      let lastError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`📝 AuthService: Profile creation attempt ${attempt}...`);
          
          const { data: profileResult, error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select('*')
            .single();

          if (profileError) {
            console.error(`❌ AuthService: Profile creation error (attempt ${attempt}):`, profileError);
            lastError = profileError;
            
            if (profileError.code === 'PGRST204' && profileError.message.includes('schema cache')) {
              if (attempt < 3) {
                console.log(`⏳ AuthService: Schema cache issue, waiting before retry...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
              } else {
                throw new AuthError('Database schema issue. Please run the latest migration (20250625013000_fix_schema_cache_final.sql) in your Supabase dashboard.', 'SCHEMA_CACHE_ERROR');
              }
            }
            
            if (profileError.code === '23505') {
              throw new AuthError('Username is already taken', 'USERNAME_TAKEN');
            }
            
            if (profileError.message.includes('new row violates row-level security policy')) {
              throw new AuthError('Database permissions issue. Please run the latest migration in your Supabase dashboard.', 'RLS_POLICY_ERROR');
            }
            
            if (attempt === 3) {
              throw new AuthError('Failed to create user profile. Please check your database setup.', 'PROFILE_CREATION_FAILED');
            }
          } else {
            profile = profileResult;
            console.log(`✅ AuthService: Profile created successfully on attempt ${attempt}:`, profile.id);
            break;
          }
        } catch (error) {
          console.error(`❌ AuthService: Exception during profile creation (attempt ${attempt}):`, error);
          if (attempt === 3) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (!profile) {
        throw new AuthError('Failed to create user profile after multiple attempts. Please check your database setup.', 'PROFILE_CREATION_FAILED');
      }

      console.log('🎉 AuthService: Signup completed successfully for user:', authData.user.id);
      
      return { user: authData.user, profile };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      console.error('❌ AuthService: Unexpected signup error:', error);
      throw new AuthError('Failed to create account. Please try again.', 'SIGNUP_FAILED');
    }
  },

  async signIn({ phone, password }: SignInData): Promise<{ user: any; profile: UserProfile | null }> {
    try {
      if (!isSupabaseConfigured()) {
        throw new AuthError('Database not configured. Please check your setup instructions.', 'NOT_CONFIGURED');
      }

      console.log('🚀 AuthService: Starting signin process for:', phone);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        phone,
        password
      });

      if (authError) {
        console.error('❌ AuthService: Auth signin error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          throw new AuthError('Invalid phone number or password', 'INVALID_CREDENTIALS');
        }
        if (authError.message.includes('Phone not confirmed')) {
          throw new AuthError('Please check your phone and confirm your account', 'PHONE_NOT_CONFIRMED');
        }
        throw new AuthError(authError.message, authError.message);
      }

      if (!authData.user) {
        console.error('❌ AuthService: No user returned from auth signin');
        throw new AuthError('Failed to sign in', 'SIGNIN_FAILED');
      }

      console.log('✅ AuthService: Auth signin successful:', authData.user.id);

      // Get user profile with phone-first logic and auto-creation
      console.log('📝 AuthService: Loading user profile...');
      let profile = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // First try to find profile by phone, then by email, then by user ID
          let query = supabase.from('profiles').select('*');
          
          if (authData.user.phone) {
            query = query.eq('phone', authData.user.phone);
          } else if (authData.user.email) {
            query = query.eq('email', authData.user.email);
          } else {
            query = query.eq('id', authData.user.id);
          }

          const { data: profileData, error: profileError } = await query.single();

          if (profileError) {
            console.error(`❌ AuthService: Profile load error (attempt ${attempt}):`, profileError);
            
            if (profileError.code === 'PGRST116') {
              // Profile doesn't exist, create it
              console.log('📝 AuthService: Profile not found, creating...');
              
              const newProfileData = {
                id: authData.user.id,
                username: authData.user.user_metadata?.username || `guest_${Math.floor(Math.random() * 100000)}`,
                phone: authData.user.phone || null,
                email: authData.user.email || null,
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
                has_completed_onboarding: false,
                daily_stats: {}
              };
              
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfileData)
                .select('*')
                .single();
              
              if (createError) {
                console.error('❌ AuthService: Failed to create profile during signin:', createError);
                if (attempt === 3) {
                  throw new AuthError('Failed to create user profile', 'PROFILE_CREATION_FAILED');
                }
              } else {
                profile = newProfile;
                console.log('✅ AuthService: Profile created during signin:', newProfile.id);
                break;
              }
            } else if (profileError.code === 'PGRST204' && profileError.message.includes('schema cache')) {
              if (attempt < 3) {
                console.log(`⏳ AuthService: Schema cache issue during signin, waiting before retry...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
              } else {
                throw new AuthError('Database schema issue. Please run the latest migration in your Supabase dashboard.', 'SCHEMA_CACHE_ERROR');
              }
            } else if (attempt === 3) {
              throw new AuthError('Failed to load user profile', 'PROFILE_LOAD_FAILED');
            }
          } else {
            profile = profileData;
            console.log(`✅ AuthService: Profile loaded successfully on attempt ${attempt}:`, profile.id);
            break;
          }
        } catch (error) {
          console.error(`❌ AuthService: Exception during profile load (attempt ${attempt}):`, error);
          if (attempt === 3) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

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

      // Use phone-first logic for profile lookup
      let query = supabase.from('profiles').select('*');
      
      if (user.phone) {
        query = query.eq('phone', user.phone);
      } else if (user.email) {
        query = query.eq('email', user.email);
      } else {
        query = query.eq('id', user.id);
      }

      const { data: profile, error: profileError } = await query.single();

      if (profileError) {
        console.warn('Error fetching profile for current user:', profileError);
        
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          const newProfileData = {
            id: user.id,
            username: user.user_metadata?.username || `guest_${Math.floor(Math.random() * 100000)}`,
            phone: user.phone || null,
            email: user.email || null,
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
            has_completed_onboarding: false,
            daily_stats: {}
          };
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfileData)
            .select('*')
            .single();
          
          if (!createError) {
            return { user, profile: newProfile };
          }
        }
        
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
          return null;
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