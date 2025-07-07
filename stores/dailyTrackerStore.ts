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
    // ✅ FIX: Add null safety check for supabase
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

// ✅ FIX 2: Enhanced function to update profile lifetime stats with XP awarding
async function updateProfileLifetimeStats(userId: string, todayStats: DailyStats) {
  try {
    // ✅ FIX: Add null safety check for supabase
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Get current profile stats
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.warn('Error fetching profile for lifetime stats update:', profileError);
      return;
    }

    // Calculate new totals by adding today's stats
    const updatedStats: any = {
      total_beers: (profile.total_beers || 0) + todayStats.beers,
      total_shots: (profile.total_shots || 0) + todayStats.shots,
      total_beer_towers: (profile.total_beer_towers || 0) + todayStats.beer_towers,
      total_funnels: (profile.total_funnels || 0) + todayStats.funnels,
      total_shotguns: (profile.total_shotguns || 0) + todayStats.shotguns,
      pool_games_won: (profile.pool_games_won || 0) + todayStats.pool_games_won,
      dart_games_won: (profile.dart_games_won || 0) + todayStats.dart_games_won,
    };

    // ✅ FIX 3: Calculate and award XP for daily activities
    let totalXPAwarded = 0;
    const xpActivities = [...(profile.xp_activities || [])];

    // Award XP for each activity
    Object.entries(todayStats).forEach(([key, value]) => {
      if (key === 'drunk_scale') {
        if (value !== null) {
          totalXPAwarded += DAILY_XP_VALUES.drunk_scale;
          xpActivities.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'drunk_scale_submission',
            xpAwarded: DAILY_XP_VALUES.drunk_scale,
            timestamp: new Date().toISOString(),
            description: `Submitted drunk scale rating: ${value}/10`,
          });
        }
      } else if (value > 0 && key in DAILY_XP_VALUES) {
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

    // ✅ FIX: Add XP and activities to updates (these properties exist in profile)
    updatedStats.xp = (profile.xp || 0) + totalXPAwarded;
    updatedStats.xp_activities = xpActivities;

    // Handle drunk scale rating
    if (todayStats.drunk_scale !== null) {
      const currentRatings = profile.drunk_scale_ratings || [];
      updatedStats.drunk_scale_ratings = [...currentRatings, todayStats.drunk_scale];
      updatedStats.last_drunk_scale_date = new Date().toISOString();
    }

    // Update profile with new lifetime totals
    // ✅ FIX: Add null safety check for supabase
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatedStats)
      .eq('id', userId);

    if (updateError) {
      console.warn('Error updating profile lifetime stats:', updateError);
    } else {
      console.log('✅ Profile lifetime stats updated successfully');
    }

    // ✅ FIX 4: Update local Zustand store with new profile data
    if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
      const userProfileStore = (window as any).__userProfileStore;
      if (userProfileStore?.getState) {
        const { setProfile } = userProfileStore.getState();
        setProfile({ ...profile, ...updatedStats });
      }
    }

    return totalXPAwarded;
  } catch (error) {
    console.warn('Error in updateProfileLifetimeStats:', error);
  }
}

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

      resetLocalStats: () => {
        console.log('🔄 Resetting daily tracker stats to default values');
        set({ 
          localStats: { ...defaultStats },
          error: null,
        });
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
              localStats: { ...defaultStats }, 
              isLoading: false,
              lastSyncDate: today,
              error: null,
            });
            return;
          }

          console.log('📊 DailyTracker: Loading today stats from Supabase...');
          
          // ✅ FIX: Add null safety check for supabase
          if (!supabase) {
            throw new Error('Supabase client not available');
          }

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
            localStats: { ...defaultStats }, 
            isLoading: false,
            lastSyncDate: today,
            error: errorMessage,
          });
        }
      },

      // ✅ FIX 5: Enhanced saveTodayStats with proper XP awarding and achievement triggering
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

          // ✅ FIX: Add null safety check for supabase
          if (!supabase) {
            throw new Error('Supabase client not available');
          }

          // Use upsert to insert or update
          const { error } = await supabase
            .from('daily_stats')
            .upsert(statsData, {
              onConflict: 'user_id,date'
            });

          if (error) {
            throw error;
          }

          // ✅ FIX 6: Update profile lifetime stats and award XP
          const xpAwarded = await updateProfileLifetimeStats(userId, localStats);

          // ✅ FIX 7: Trigger achievement checking
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).__achievementStore && (window as any).__userProfileStore) {
              const achievementStore = (window as any).__achievementStore;
              const userProfileStore = (window as any).__userProfileStore;
              
              if (achievementStore?.getState && userProfileStore?.getState) {
                const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
                const { profile } = userProfileStore.getState();
                
                if (profile) {
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
          const errorMessage = error instanceof Error ? error.message : 'Failed to save stats';
          set({ 
            isSaving: false,
            error: errorMessage,
          });
          throw error;
        }
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
          
          // ✅ FIX: Add null safety check for supabase
          if (!supabase) {
            console.warn('Supabase client not available');
            return true;
          }

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