import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Helper function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Daily stats helpers
export const dailyStatsHelpers = {
  async getLifetimeStats(userId: string) {
    try {
      const { data: dailyStats, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching daily stats:', error);
        return {
          totalBeers: 0,
          totalShots: 0,
          totalBeerTowers: 0,
          totalFunnels: 0,
          totalShotguns: 0,
          totalPoolGames: 0,
          totalDartGames: 0,
          totalDrinksLogged: 0,
          avgDrunkScale: 0,
          barsHit: 0,
          nightsOut: 0,
        };
      }

      if (!dailyStats || dailyStats.length === 0) {
        return {
          totalBeers: 0,
          totalShots: 0,
          totalBeerTowers: 0,
          totalFunnels: 0,
          totalShotguns: 0,
          totalPoolGames: 0,
          totalDartGames: 0,
          totalDrinksLogged: 0,
          avgDrunkScale: 0,
          barsHit: 0,
          nightsOut: 0,
        };
      }

      // Calculate totals
      const totals = dailyStats.reduce((acc, day) => ({
        totalBeers: acc.totalBeers + (day.beers || 0),
        totalShots: acc.totalShots + (day.shots || 0),
        totalBeerTowers: acc.totalBeerTowers + (day.beer_towers || 0),
        totalFunnels: acc.totalFunnels + (day.funnels || 0),
        totalShotguns: acc.totalShotguns + (day.shotguns || 0),
        totalPoolGames: acc.totalPoolGames + (day.pool_games_won || 0),
        totalDartGames: acc.totalDartGames + (day.dart_games_won || 0),
        drunkScaleSum: acc.drunkScaleSum + (day.drunk_scale || 0),
        drunkScaleCount: acc.drunkScaleCount + (day.drunk_scale ? 1 : 0),
      }), {
        totalBeers: 0,
        totalShots: 0,
        totalBeerTowers: 0,
        totalFunnels: 0,
        totalShotguns: 0,
        totalPoolGames: 0,
        totalDartGames: 0,
        drunkScaleSum: 0,
        drunkScaleCount: 0,
      });

      const totalDrinksLogged = totals.totalBeers + totals.totalShots + totals.totalBeerTowers + totals.totalFunnels + totals.totalShotguns;
      const avgDrunkScale = totals.drunkScaleCount > 0 ? Math.round((totals.drunkScaleSum / totals.drunkScaleCount) * 10) / 10 : 0;
      const nightsOut = dailyStats.length; // Each day with stats counts as a night out

      // Get bars hit from profile (this is tracked separately)
      const { data: profile } = await supabase
        .from('profiles')
        .select('bars_hit')
        .eq('id', userId)
        .single();

      return {
        totalBeers: totals.totalBeers,
        totalShots: totals.totalShots,
        totalBeerTowers: totals.totalBeerTowers,
        totalFunnels: totals.totalFunnels,
        totalShotguns: totals.totalShotguns,
        totalPoolGames: totals.totalPoolGames,
        totalDartGames: totals.totalDartGames,
        totalDrinksLogged,
        avgDrunkScale,
        barsHit: profile?.bars_hit || 0,
        nightsOut,
      };
    } catch (error) {
      console.error('Error in getLifetimeStats:', error);
      return {
        totalBeers: 0,
        totalShots: 0,
        totalBeerTowers: 0,
        totalFunnels: 0,
        totalShotguns: 0,
        totalPoolGames: 0,
        totalDartGames: 0,
        totalDrinksLogged: 0,
        avgDrunkScale: 0,
        barsHit: 0,
        nightsOut: 0,
      };
    }
  },

  async getTodayStats(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching today stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTodayStats:', error);
      return null;
    }
  },

  async upsertTodayStats(userId: string, stats: any) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_stats')
        .upsert({
          user_id: userId,
          date: today,
          ...stats,
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting today stats:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in upsertTodayStats:', error);
      throw error;
    }
  }
};