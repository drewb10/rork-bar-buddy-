import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const isConfigured = supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key' &&
         supabaseUrl.includes('supabase.co') &&
         supabaseAnonKey.length > 50;
  
  if (!isConfigured) {
    console.warn('🔧 Supabase not configured. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly.');
  }
  
  return isConfigured;
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'barbuddy-app',
    },
  },
});

// Helper function to get current user ID
export const getCurrentUserId = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  } catch (error) {
    console.warn('Error getting current user ID:', error);
    return null;
  }
};

// Helper function to ensure user is authenticated
export const ensureAuth = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// Daily Stats Helper Functions
export const dailyStatsHelpers = {
  // Get today's date in YYYY-MM-DD format
  getTodayDate: () => {
    return new Date().toISOString().split('T')[0];
  },

  // Get or create today's daily stats
  getTodayStats: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const today = dailyStatsHelpers.getTodayDate();
    
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no record exists, return default values
    if (!data) {
      return {
        id: '',
        user_id: userId,
        date: today,
        drunk_scale: null,
        beers: 0,
        shots: 0,
        scoop_and_scores: 0,
        beer_towers: 0,
        funnels: 0,
        shotguns: 0,
        pool_games_won: 0,
        dart_games_won: 0,
        created_at: '',
        updated_at: '',
      };
    }

    return data;
  },

  // Save today's daily stats (insert or update)
  saveTodayStats: async (userId: string, stats: {
    drunk_scale?: number | null;
    beers?: number;
    shots?: number;
    scoop_and_scores?: number;
    beer_towers?: number;
    funnels?: number;
    shotguns?: number;
    pool_games_won?: number;
    dart_games_won?: number;
  }) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const today = dailyStatsHelpers.getTodayDate();
    
    // Try to update first
    const { data: updateData, error: updateError } = await supabase
      .from('daily_stats')
      .update({
        ...stats,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('date', today)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // Record doesn't exist, insert new one
      const { data: insertData, error: insertError } = await supabase
        .from('daily_stats')
        .insert({
          user_id: userId,
          date: today,
          ...stats,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return insertData;
    }

    if (updateError) {
      throw updateError;
    }

    return updateData;
  },

  // Get lifetime stats aggregated from all daily_stats
  getLifetimeStats: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    // Get all daily stats for the user
    const { data: dailyStats, error: dailyError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId);

    if (dailyError) {
      throw dailyError;
    }

    // Get unique venue interactions for bars hit count
    const { data: venueInteractions, error: venueError } = await supabase
      .from('venue_interactions')
      .select('venue_id')
      .eq('user_id', userId);

    if (venueError) {
      console.warn('Error fetching venue interactions:', venueError);
    }

    // Calculate aggregated stats
    const stats = dailyStats || [];
    const uniqueVenues = new Set((venueInteractions || []).map(v => v.venue_id));

    const totalBeers = stats.reduce((sum, day) => sum + (day.beers || 0), 0);
    const totalShots = stats.reduce((sum, day) => sum + (day.shots || 0), 0);
    const totalScoopAndScores = stats.reduce((sum, day) => sum + (day.scoop_and_scores || 0), 0);
    const totalBeerTowers = stats.reduce((sum, day) => sum + (day.beer_towers || 0), 0);
    const totalFunnels = stats.reduce((sum, day) => sum + (day.funnels || 0), 0);
    const totalShotguns = stats.reduce((sum, day) => sum + (day.shotguns || 0), 0);
    const totalPoolGames = stats.reduce((sum, day) => sum + (day.pool_games_won || 0), 0);
    const totalDartGames = stats.reduce((sum, day) => sum + (day.dart_games_won || 0), 0);

    // Calculate average drunk scale (only from non-null values)
    const drunkScaleRatings = stats
      .map(day => day.drunk_scale)
      .filter(rating => rating !== null && rating !== undefined) as number[];
    
    const avgDrunkScale = drunkScaleRatings.length > 0
      ? Math.round((drunkScaleRatings.reduce((sum, rating) => sum + rating, 0) / drunkScaleRatings.length) * 10) / 10
      : 0;

    return {
      totalBeers,
      totalShots,
      totalScoopAndScores,
      totalBeerTowers,
      totalFunnels,
      totalShotguns,
      totalPoolGames,
      totalDartGames,
      totalDrinksLogged: totalBeers + totalShots + totalScoopAndScores + totalBeerTowers + totalFunnels + totalShotguns,
      avgDrunkScale,
      barsHit: uniqueVenues.size,
      nightsOut: stats.length, // Each day with stats counts as a night out
    };
  },

  // Check if user can submit drunk scale today
  canSubmitDrunkScaleToday: async (userId: string) => {
    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      const todayStats = await dailyStatsHelpers.getTodayStats(userId);
      return todayStats.drunk_scale === null || todayStats.drunk_scale === undefined;
    } catch (error) {
      console.warn('Error checking drunk scale submission:', error);
      return true;
    }
  },
};

// Test connection function
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, error: 'Connection failed' };
  }
};