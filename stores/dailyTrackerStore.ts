import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface DailyStats {
  beers: number;
  shots: number;
  beer_towers: number;
  funnels: number;
  shotguns: number;
  pool_games_won: number;
  dart_games_won: number;
  drunk_scale: number | null;
}

interface DailyTrackerStore {
  localStats: DailyStats;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSyncDate: string | null;
  
  updateLocalStats: (updates: Partial<DailyStats>) => void;
  resetLocalStats: () => void;
  loadTodayStats: () => Promise<void>;
  saveTodayStats: () => Promise<void>;
  canSubmitDrunkScale: () => Promise<boolean>;
  clearError: () => void;
}

// ✅ FIX 1: Define XP values for daily activities
const DAILY_XP_VALUES = {
  beers: 5,
  shots: 5,
  beer_towers: 15,
  funnels: 10,
  shotguns: 10,
  pool_games_won: 15,
  dart_games_won: 15,
  drunk_scale: 25,
} as const;

const defaultStats: DailyStats = {
  beers: 0,
  shots: 0,
  beer_towers: 0,
  funnels: 0,
  shotguns: 0,
  pool_games_won: 0,
  dart_games_won: 0,
  drunk_scale: null,
};

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const getCurrentUserId = async () => {
  try {
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// ✅ FIX 2: Enhanced function to update profile with ACCUMULATIVE stats
const updateProfileLifetimeStats = async (userId: string, newDailyStats: DailyStats, existingDailyStats: DailyStats) => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Get current profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Failed to get profile for stats update');
    }

    // ✅ FIX 3: Calculate INCREMENTAL updates (only the difference from what was saved today)
    const incrementalStats = {
      beers: newDailyStats.beers - existingDailyStats.beers,
      shots: newDailyStats.shots - existingDailyStats.shots,
      beer_towers: newDailyStats.beer_towers - existingDailyStats.beer_towers,
      funnels: newDailyStats.funnels - existingDailyStats.funnels,
      shotguns: newDailyStats.shotguns - existingDailyStats.shotguns,
      pool_games_won: newDailyStats.pool_games_won - existingDailyStats.pool_games_won,
      dart_games_won: newDailyStats.dart_games_won - existingDailyStats.dart_games_won,
    };

    // Only update profile totals with the incremental changes
    const updates: any = {
      total_beers: (profile.total_beers || 0) + incrementalStats.beers,
      total_shots: (profile.total_shots || 0) + incrementalStats.shots,
      total_beer_towers: (profile.total_beer_towers || 0) + incrementalStats.beer_towers,
      total_funnels: (profile.total_funnels || 0) + incrementalStats.funnels,
      total_shotguns: (profile.total_shotguns || 0) + incrementalStats.shotguns,
      pool_games_won: (profile.pool_games_won || 0) + incrementalStats.pool_games_won,
      dart_games_won: (profile.dart_games_won || 0) + incrementalStats.dart_games_won,
      updated_at: new Date().toISOString(),
    };

    // ✅ FIX 4: Calculate and award XP only for incremental activities
    let totalXPAwarded = 0;
    const xpActivities = [...(profile.xp_activities || [])];

    // Award XP for each incremental activity
    Object.entries(incrementalStats).forEach(([key, value]) => {
      if (value > 0 && key in DAILY_XP_VALUES) {
        const xpPerActivity = DAILY_XP_VALUES[key as keyof typeof DAILY_XP_VALUES];
        const xpForThisActivity = xpPerActivity * value;
        totalXPAwarded += xpForThisActivity;
        
        xpActivities.push({
          id: Math.random().toString(36).substr(2, 9),
          type: key as any,
          xpAwarded: xpForThisActivity,
          timestamp: new Date().toISOString(),
          description: `Logged ${value} ${key.replace('_', ' ')}`,
        });
      }
    });

    // Award XP for drunk scale if it's new or changed
    if (newDailyStats.drunk_scale !== null && newDailyStats.drunk_scale !== existingDailyStats.drunk_scale) {
      totalXPAwarded += DAILY_XP_VALUES.drunk_scale;
      xpActivities.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'drunk_scale_submission',
        xpAwarded: DAILY_XP_VALUES.drunk_scale,
        timestamp: new Date().toISOString(),
        description: `Submitted drunk scale rating: ${newDailyStats.drunk_scale}/10`,
      });
    }

    // Add XP and activities to updates
    updates.xp = (profile.xp || 0) + totalXPAwarded;
    updates.xp_activities = xpActivities;

    // Handle drunk scale rating
    if (newDailyStats.drunk_scale !== null && newDailyStats.drunk_scale !== existingDailyStats.drunk_scale) {
      const currentRatings = profile.drunk_scale_ratings || [];
      updates.drunk_scale_ratings = [...currentRatings, newDailyStats.drunk_scale];
      updates.last_drunk_scale_date = new Date().toISOString();
    }

    // Update profile in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Profile updated with incremental stats. XP awarded: ${totalXPAwarded}`);

    // ✅ FIX 5: Update local Zustand store with new profile data
    if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
      const userProfileStore = (window as any).__userProfileStore;
      if (userProfileStore?.getState) {
        const { setProfile } = userProfileStore.getState();
        if (setProfile) {
          setProfile({ ...profile, ...updates });
        }
      }
    }

    return totalXPAwarded;
  } catch (error) {
    console.error('Error updating profile lifetime stats:', error);
    throw error;
  }
};

export const useDailyTrackerStore = create<DailyTrackerStore>()(
  persist(
    (set, get) => ({
      localStats: { ...defaultStats },
      isLoading: false,
      isSaving: false,
      error: null,
      lastSyncDate: null,

      updateLocalStats: (updates) => {
        set((state) => ({
          localStats: { ...state.localStats, ...updates }
        }));
      },

      resetLocalStats: () => {
        set({ localStats: { ...defaultStats } });
      },

      clearError: () => {
        set({ error: null });
      },

      canSubmitDrunkScale: async () => {
        if (!isSupabaseConfigured()) return true; // Allow in demo mode

        try {
          const userId = await getCurrentUserId();
          if (!userId) return false;

          const today = getTodayString();
          
          if (!supabase) {
            console.warn('Supabase client not available');
            return true;
          }

          // Check if user has already submitted drunk scale today
          const { data, error } = await supabase
            .from('daily_stats')
            .select('drunk_scale')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error checking drunk scale submission:', error);
            return false;
          }

          return !data || data.drunk_scale === null;
        } catch (error) {
          console.error('Error checking drunk scale eligibility:', error);
          return false;
        }
      },

      loadTodayStats: async () => {
        if (!isSupabaseConfigured()) {
          console.log('📊 DailyTracker: Supabase not configured, using local stats');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const userId = await getCurrentUserId();
          if (!userId) {
            set({ 
              localStats: { ...defaultStats }, 
              isLoading: false,
              error: 'User not authenticated',
            });
            return;
          }

          const today = getTodayString();
          console.log('📊 DailyTracker: Loading stats for', today);

          if (!supabase) {
            throw new Error('Supabase client not available');
          }

          const { data, error } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          // ✅ FIX 6: Load existing stats to maintain accumulation
          const loadedStats: DailyStats = {
            beers: data?.beers || 0,
            shots: data?.shots || 0,
            beer_towers: data?.beer_towers || 0,
            funnels: data?.funnels || 0,
            shotguns: data?.shotguns || 0,
            pool_games_won: data?.pool_games_won || 0,
            dart_games_won: data?.dart_games_won || 0,
            drunk_scale: data?.drunk_scale || null,
          };

          set({ 
            localStats: loadedStats, 
            isLoading: false,
            lastSyncDate: today,
            error: null,
          });

          console.log('📊 DailyTracker: Loaded today stats:', loadedStats);
        } catch (error) {
          console.error('📊 DailyTracker: Error loading today stats:', error);
          const errorMessage = error instanceof Error ? 
            error.message : 'Failed to load stats';
          set({ 
            localStats: { ...defaultStats }, 
            isLoading: false,
            lastSyncDate: getTodayString(),
            error: errorMessage,
          });
        }
      },

      // ✅ FIX 7: Enhanced saveTodayStats with proper accumulation
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

          if (!supabase) {
            throw new Error('Supabase client not available');
          }

          // ✅ FIX 8: Get existing stats before saving to calculate incremental changes
          const { data: existingData } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

          const existingStats: DailyStats = existingData ? {
            beers: existingData.beers || 0,
            shots: existingData.shots || 0,
            beer_towers: existingData.beer_towers || 0,
            funnels: existingData.funnels || 0,
            shotguns: existingData.shotguns || 0,
            pool_games_won: existingData.pool_games_won || 0,
            dart_games_won: existingData.dart_games_won || 0,
            drunk_scale: existingData.drunk_scale || null,
          } : { ...defaultStats };

          // Prepare the data for insertion/update
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

          // ✅ FIX 9: Update profile with incremental changes only
          const xpAwarded = await updateProfileLifetimeStats(userId, localStats, existingStats);

          // ✅ FIX 10: Trigger achievement checking
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).__achievementStore && (window as any).__userProfileStore) {
              const achievementStore = (window as any).__achievementStore;
              const userProfileStore = (window as any).__userProfileStore;
              
              if (achievementStore?.getState && userProfileStore?.getState) {
                const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
                const { profile } = userProfileStore.getState();
                
                if (profile && checkAndUpdateMultiLevelAchievements) {
                  checkAndUpdateMultiLevelAchievements({
                    totalBeers: profile.total_beers || 0,
                    totalShots: profile.total_shots || 0,
                    totalBeerTowers: profile.total_beer_towers || 0,
                    totalScoopAndScores: profile.total_scoop_and_scores || 0,
                    totalFunnels: profile.total_funnels || 0,
                    totalShotguns: profile.total_shotguns || 0,
                    poolGamesWon: profile.pool_games_won || 0,
                    dartGamesWon: profile.dart_games_won || 0,
                    barsHit: profile.bars_hit || 0,
                    nightsOut: profile.nights_out || 0,
                  });
                }
              }
            }
          }, 500);

          set({ 
            isSaving: false,
            lastSyncDate: today,
            error: null,
          });

          console.log(`📊 DailyTracker: Stats saved successfully. XP awarded: ${xpAwarded}`);
        } catch (error) {
          console.error('📊 DailyTracker: Error saving stats:', error);
          const errorMessage = error instanceof Error ? 
            error.message : 'Failed to save stats';
          set({ 
            isSaving: false,
            error: errorMessage,
          });
          throw error;
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