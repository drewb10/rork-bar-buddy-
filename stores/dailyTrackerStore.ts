import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyStats {
  shots: number;
  scoopAndScores: number;
  beers: number;
  beerTowers: number;
  funnels: number;
  shotguns: number;
  poolGamesWon: number;
  dartGamesWon: number;
  date: string;
  lastResetAt: string;
}

interface TotalStats {
  shots: number;
  scoopAndScores: number;
  beers: number;
  beerTowers: number;
  funnels: number;
  shotguns: number;
  poolGamesWon: number;
  dartGamesWon: number;
}

interface DailyTrackerState {
  dailyStats: DailyStats;
  totalStats: TotalStats;
  updateDailyStats: (stats: Partial<Omit<DailyStats, 'date' | 'lastResetAt'>>) => void;
  resetDailyStats: () => void;
  getDailyStats: () => DailyStats;
  getTotalStats: () => TotalStats;
  checkAndResetIfNeeded: () => void;
}

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const shouldResetAt3AM = (lastResetAt: string): boolean => {
  try {
    const lastReset = new Date(lastResetAt);
    const now = new Date();
    
    // Create 3 AM reset time for today
    const resetTime = new Date(now);
    resetTime.setHours(3, 0, 0, 0);
    
    // If it's past 3 AM today and last reset was before today's 3 AM, reset
    if (now >= resetTime && lastReset < resetTime) {
      return true;
    }
    
    // If it's before 3 AM today, check if last reset was before yesterday's 3 AM
    if (now < resetTime) {
      const yesterdayResetTime = new Date(resetTime);
      yesterdayResetTime.setDate(yesterdayResetTime.getDate() - 1);
      return lastReset < yesterdayResetTime;
    }
    
    return false;
  } catch {
    return true; // Reset if there's any error parsing dates
  }
};

const defaultDailyStats: DailyStats = {
  shots: 0,
  scoopAndScores: 0,
  beers: 0,
  beerTowers: 0,
  funnels: 0,
  shotguns: 0,
  poolGamesWon: 0,
  dartGamesWon: 0,
  date: getTodayString(),
  lastResetAt: new Date().toISOString(),
};

const defaultTotalStats: TotalStats = {
  shots: 0,
  scoopAndScores: 0,
  beers: 0,
  beerTowers: 0,
  funnels: 0,
  shotguns: 0,
  poolGamesWon: 0,
  dartGamesWon: 0,
};

export const useDailyTrackerStore = create<DailyTrackerState>()(
  persist(
    (set, get) => ({
      dailyStats: defaultDailyStats,
      totalStats: defaultTotalStats,

      checkAndResetIfNeeded: () => {
        const { dailyStats } = get();
        if (shouldResetAt3AM(dailyStats.lastResetAt)) {
          get().resetDailyStats();
        }
      },

      updateDailyStats: (stats) => {
        // Check for reset before updating
        get().checkAndResetIfNeeded();
        
        const today = getTodayString();
        
        set((state) => {
          const currentStats = state.dailyStats;
          
          // Calculate the differences to avoid double counting
          const shotsDiff = Math.max(0, (stats.shots || 0) - currentStats.shots);
          const scoopDiff = Math.max(0, (stats.scoopAndScores || 0) - currentStats.scoopAndScores);
          const beersDiff = Math.max(0, (stats.beers || 0) - currentStats.beers);
          const beerTowersDiff = Math.max(0, (stats.beerTowers || 0) - currentStats.beerTowers);
          const funnelsDiff = Math.max(0, (stats.funnels || 0) - currentStats.funnels);
          const shotgunsDiff = Math.max(0, (stats.shotguns || 0) - currentStats.shotguns);
          const poolDiff = Math.max(0, (stats.poolGamesWon || 0) - currentStats.poolGamesWon);
          const dartDiff = Math.max(0, (stats.dartGamesWon || 0) - currentStats.dartGamesWon);
          
          const updatedDailyStats: DailyStats = {
            shots: stats.shots !== undefined ? stats.shots : currentStats.shots,
            scoopAndScores: stats.scoopAndScores !== undefined ? stats.scoopAndScores : currentStats.scoopAndScores,
            beers: stats.beers !== undefined ? stats.beers : currentStats.beers,
            beerTowers: stats.beerTowers !== undefined ? stats.beerTowers : currentStats.beerTowers,
            funnels: stats.funnels !== undefined ? stats.funnels : currentStats.funnels,
            shotguns: stats.shotguns !== undefined ? stats.shotguns : currentStats.shotguns,
            poolGamesWon: stats.poolGamesWon !== undefined ? stats.poolGamesWon : currentStats.poolGamesWon,
            dartGamesWon: stats.dartGamesWon !== undefined ? stats.dartGamesWon : currentStats.dartGamesWon,
            date: today,
            lastResetAt: currentStats.lastResetAt,
          };
          
          const updatedTotalStats: TotalStats = {
            shots: state.totalStats.shots + shotsDiff,
            scoopAndScores: state.totalStats.scoopAndScores + scoopDiff,
            beers: state.totalStats.beers + beersDiff,
            beerTowers: state.totalStats.beerTowers + beerTowersDiff,
            funnels: state.totalStats.funnels + funnelsDiff,
            shotguns: state.totalStats.shotguns + shotgunsDiff,
            poolGamesWon: state.totalStats.poolGamesWon + poolDiff,
            dartGamesWon: state.totalStats.dartGamesWon + dartDiff,
          };
          
          // Update achievements if there are any increases
          if (typeof window !== 'undefined' && (window as any).__achievementStore) {
            const achievementStore = (window as any).__achievementStore;
            if (achievementStore?.getState) {
              const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
              checkAndUpdateMultiLevelAchievements({
                totalBeers: updatedTotalStats.beers,
                totalShots: updatedTotalStats.shots,
                totalBeerTowers: updatedTotalStats.beerTowers,
                totalScoopAndScores: updatedTotalStats.scoopAndScores,
                totalFunnels: updatedTotalStats.funnels,
                totalShotguns: updatedTotalStats.shotguns,
                poolGamesWon: updatedTotalStats.poolGamesWon,
                dartGamesWon: updatedTotalStats.dartGamesWon,
                barsHit: 0, // This comes from user profile
                nightsOut: 0, // This comes from user profile
              });
            }
          }
          
          return {
            dailyStats: updatedDailyStats,
            totalStats: updatedTotalStats,
          };
        });
      },

      resetDailyStats: () => {
        set({
          dailyStats: { 
            ...defaultDailyStats, 
            date: getTodayString(),
            lastResetAt: new Date().toISOString(),
          },
        });
      },

      getDailyStats: () => {
        get().checkAndResetIfNeeded();
        const { dailyStats } = get();
        const today = getTodayString();
        
        if (dailyStats.date === today) {
          return dailyStats;
        }
        
        return { 
          ...defaultDailyStats, 
          date: today,
          lastResetAt: new Date().toISOString(),
        };
      },

      getTotalStats: () => {
        return get().totalStats;
      },
    }),
    {
      name: 'daily-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);