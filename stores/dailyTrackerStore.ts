import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface DailyStats {
  drunk_scale: number | null;
  beers: number;
  shots: number;
  beer_towers: number;
  funnels: number;
  shotguns: number;
  pool_games_won: number;
  dart_games_won: number;
}

interface DailyTrackerState {
  localStats: DailyStats;
  isLoading: boolean;
  isSaving: boolean;
  lastSyncDate: string | null;
  error: string | null;
  
  // Actions
  updateLocalStats: (stats: Partial<DailyStats>) => void;
  loadTodayStats: () => Promise<void>;
  saveTodayStats: () => Promise<void>;
  resetLocalStats: () => void;
  canSubmitDrunkScale: () => Promise<boolean>;
  clearError: () => void;
}

const defaultStats: DailyStats = {
  drunk_scale: null,
  beers: 0,
  shots: 0,
  beer_towers: 0,
  funnels: 0,
  shotguns: 0,
  pool_games_won: 0,
  dart_games_won: 0,
};

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const useDailyTrackerStore = create<DailyTrackerState>()(
  persist(
    (set, get) => ({
      localStats: defaultStats,
      isLoading: false,
      isSaving: false,
      lastSyncDate: null,
      error: null,

      clearError: () => {
        set({ error: null });
      },

      updateLocalStats: (stats: Partial<DailyStats>) => {
        set((state) => ({
          localStats: {
            ...state.localStats,
            ...stats,
          },
          error: null, // Clear any previous errors when updating stats
        }));
      },

      loadTodayStats: async () => {
        if (!isSupabaseConfigured()) {
          console.log('📊 DailyTracker: Supabase not configured, using local stats');
          return;
        }

        const today = getTodayString();
        const { lastSyncDate, isLoading, isSaving } = get();

        // Prevent multiple simultaneous loads
        if (isLoading || isSaving) {
          console.log('📊 DailyTracker: Load already in progress, skipping...');
          return;
        }

        // If we already synced today, don't reload
        if (lastSyncDate === today) {
          console.log('📊 DailyTracker: Already synced today, skipping load');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const userId = await getCurrentUserId();
          if (!userId) {
            console.log('📊 DailyTracker: No authenticated user, using default stats');
            set({ 
              localStats: defaultStats, 
              isLoading: false,
              lastSyncDate: today,
              error: null,
            });
            return;
          }

          console.log('📊 DailyTracker: Loading today stats from Supabase...');
          
          const { data: todayStats, error } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          const stats = todayStats || {};

          set({
            localStats: {
              drunk_scale: stats.drunk_scale || null,
              beers: stats.beers || 0,
              shots: stats.shots || 0,
              beer_towers: stats.beer_towers || 0,
              funnels: stats.funnels || 0,
              shotguns: stats.shotguns || 0,
              pool_games_won: stats.pool_games_won || 0,
              dart_games_won: stats.dart_games_won || 0,
            },
            isLoading: false,
            lastSyncDate: today,
            error: null,
          });

          console.log('📊 DailyTracker: Stats loaded successfully');
        } catch (error) {
          console.error('📊 DailyTracker: Error loading today stats:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load stats';
          set({ 
            localStats: defaultStats, 
            isLoading: false,
            lastSyncDate: today,
            error: errorMessage,
          });
        }
      },

      saveTodayStats: async () => {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase not configured');
        }

        const { localStats, isSaving, isLoading } = get();

        // Prevent multiple simultaneous saves
        if (isSaving || isLoading) {
          console.log('📊 DailyTracker: Save already in progress, skipping...');
          return;
        }

        set({ isSaving: true, error: null });

        try {
          const userId = await getCurrentUserId();
          if (!userId) {
            throw new Error('User not authenticated');
          }

          const today = getTodayString();
          console.log('📊 DailyTracker: Saving stats to Supabase...', localStats);

          // Prepare the data for insertion/update - only include valid columns
          const statsData = {
            user_id: userId,
            date: today,
            drunk_scale: localStats.drunk_scale,
            beers: localStats.beers,
            shots: localStats.shots,
            beer_towers: localStats.beer_towers,
            funnels: localStats.funnels,
            shotguns: localStats.shotguns,
            pool_games_won: localStats.pool_games_won,
            dart_games_won: localStats.dart_games_won,
          };

          // Use upsert to insert or update
          const { error } = await supabase
            .from('daily_stats')
            .upsert(statsData, {
              onConflict: 'user_id,date'
            });

          if (error) {
            throw error;
          }

          // Update profile lifetime stats
          await updateProfileLifetimeStats(userId, localStats);

          set({ 
            isSaving: false,
            lastSyncDate: today,
            error: null,
          });

          console.log('📊 DailyTracker: Stats saved successfully');
        } catch (error) {
          console.error('📊 DailyTracker: Error saving stats:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to save stats';
          set({ 
            isSaving: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      resetLocalStats: () => {
        set({ 
          localStats: defaultStats,
          error: null,
        });
      },

      canSubmitDrunkScale: async () => {
        if (!isSupabaseConfigured()) {
          return true;
        }

        try {
          const userId = await getCurrentUserId();
          if (!userId) {
            return true;
          }

          const today = getTodayString();
          
          const { data, error } = await supabase
            .from('daily_stats')
            .select('drunk_scale')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.warn('📊 DailyTracker: Error checking drunk scale submission:', error);
            return true;
          }

          // If no record exists or drunk_scale is null, user can submit
          return !data || data.drunk_scale === null;
        } catch (error) {
          console.warn('📊 DailyTracker: Error checking drunk scale submission:', error);
          return true;
        }
      },
    }),
    {
      name: 'daily-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        localStats: state.localStats,
        lastSyncDate: state.lastSyncDate,
      }),
    }
  )
);

// Helper function to update profile lifetime stats
async function updateProfileLifetimeStats(userId: string, todayStats: DailyStats) {
  try {
    // Get current profile stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_beers, total_shots, total_beer_towers, total_funnels, total_shotguns, pool_games_won, dart_games_won')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.warn('Error fetching profile for lifetime stats update:', profileError);
      return;
    }

    // Calculate new totals by adding today's stats
    const updatedStats = {
      total_beers: (profile.total_beers || 0) + todayStats.beers,
      total_shots: (profile.total_shots || 0) + todayStats.shots,
      total_beer_towers: (profile.total_beer_towers || 0) + todayStats.beer_towers,
      total_funnels: (profile.total_funnels || 0) + todayStats.funnels,
      total_shotguns: (profile.total_shotguns || 0) + todayStats.shotguns,
      pool_games_won: (profile.pool_games_won || 0) + todayStats.pool_games_won,
      dart_games_won: (profile.dart_games_won || 0) + todayStats.dart_games_won,
    };

    // Update profile with new lifetime totals
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatedStats)
      .eq('id', userId);

    if (updateError) {
      console.warn('Error updating profile lifetime stats:', updateError);
    } else {
      console.log('✅ Profile lifetime stats updated successfully');
    }
  } catch (error) {
    console.warn('Error in updateProfileLifetimeStats:', error);
  }
}