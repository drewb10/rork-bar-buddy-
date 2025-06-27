import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailyStatsHelpers, getCurrentUserId, isSupabaseConfigured } from '@/lib/supabase';

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
          const todayStats = await dailyStatsHelpers.getTodayStats(userId);

          set({
            localStats: {
              drunk_scale: todayStats.drunk_scale,
              beers: todayStats.beers || 0,
              shots: todayStats.shots || 0,
              beer_towers: todayStats.beer_towers || 0,
              funnels: todayStats.funnels || 0,
              shotguns: todayStats.shotguns || 0,
              pool_games_won: todayStats.pool_games_won || 0,
              dart_games_won: todayStats.dart_games_won || 0,
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

          console.log('📊 DailyTracker: Saving stats to Supabase...', localStats);

          // Save to daily_stats table
          await dailyStatsHelpers.saveTodayStats(userId, localStats);

          const today = getTodayString();
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
          lastSyncDate: null,
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

          return await dailyStatsHelpers.canSubmitDrunkScaleToday(userId);
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