import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailyStatsHelpers, getCurrentUserId, isSupabaseConfigured } from '@/lib/supabase';

interface DailyStats {
  drunk_scale: number | null;
  beers: number;
  shots: number;
  scoop_and_scores: number;
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
  
  // Actions
  updateLocalStats: (stats: Partial<DailyStats>) => void;
  loadTodayStats: () => Promise<void>;
  saveTodayStats: () => Promise<void>;
  resetLocalStats: () => void;
  canSubmitDrunkScale: () => Promise<boolean>;
}

const defaultStats: DailyStats = {
  drunk_scale: null,
  beers: 0,
  shots: 0,
  scoop_and_scores: 0,
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

      updateLocalStats: (stats: Partial<DailyStats>) => {
        set((state) => ({
          localStats: {
            ...state.localStats,
            ...stats,
          },
        }));
      },

      loadTodayStats: async () => {
        if (!isSupabaseConfigured()) {
          console.log('📊 DailyTracker: Supabase not configured, using local stats');
          return;
        }

        const today = getTodayString();
        const { lastSyncDate } = get();

        // If we already synced today, don't reload
        if (lastSyncDate === today) {
          console.log('📊 DailyTracker: Already synced today, skipping load');
          return;
        }

        set({ isLoading: true });

        try {
          const userId = await getCurrentUserId();
          if (!userId) {
            console.log('📊 DailyTracker: No authenticated user, using default stats');
            set({ 
              localStats: defaultStats, 
              isLoading: false,
              lastSyncDate: today,
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
              scoop_and_scores: todayStats.scoop_and_scores || 0,
              beer_towers: todayStats.beer_towers || 0,
              funnels: todayStats.funnels || 0,
              shotguns: todayStats.shotguns || 0,
              pool_games_won: todayStats.pool_games_won || 0,
              dart_games_won: todayStats.dart_games_won || 0,
            },
            isLoading: false,
            lastSyncDate: today,
          });

          console.log('📊 DailyTracker: Stats loaded successfully');
        } catch (error) {
          console.error('📊 DailyTracker: Error loading today stats:', error);
          set({ 
            localStats: defaultStats, 
            isLoading: false,
            lastSyncDate: today,
          });
        }
      },

      saveTodayStats: async () => {
        if (!isSupabaseConfigured()) {
          throw new Error('Supabase not configured');
        }

        const { localStats, isSaving } = get();

        if (isSaving) {
          console.log('📊 DailyTracker: Save already in progress');
          return;
        }

        set({ isSaving: true });

        try {
          const userId = await getCurrentUserId();
          if (!userId) {
            throw new Error('User not authenticated');
          }

          console.log('📊 DailyTracker: Saving stats to Supabase...', localStats);

          await dailyStatsHelpers.saveTodayStats(userId, localStats);

          const today = getTodayString();
          set({ 
            isSaving: false,
            lastSyncDate: today,
          });

          console.log('📊 DailyTracker: Stats saved successfully');
        } catch (error) {
          console.error('📊 DailyTracker: Error saving stats:', error);
          set({ isSaving: false });
          throw error;
        }
      },

      resetLocalStats: () => {
        set({ 
          localStats: defaultStats,
          lastSyncDate: null,
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