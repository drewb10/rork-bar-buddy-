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
  drunkScale?: number;
  date: string;
}

interface TotalStats {
  shots: number;
  scoopAndScores: number;
  beers: number;
  beerTowers: number;
  funnels: number;
  shotguns: number;
}

interface DailyTrackerState {
  dailyStats: DailyStats;
  totalStats: TotalStats;
  lastResetDate: string;
  lastDrunkScaleDate?: string;
  updateDailyStat: (stat: keyof Omit<DailyStats, 'date' | 'drunkScale'>, increment: number) => void;
  setDrunkScale: (rating: number) => void;
  canSubmitDrunkScale: () => boolean;
  resetDailyStatsIfNeeded: () => void;
  getDailyTotal: () => number;
  getTotalCount: () => number;
  resetAllStats: () => void;
  awardXPForStats: () => void;
}

const RESET_HOUR = 5; // 5 AM

const XP_VALUES = {
  shots: 5,
  scoopAndScores: 4,
  beers: 2,
  beerTowers: 5,
  funnels: 3,
  shotguns: 3,
};

const shouldResetDaily = (lastResetDate: string): boolean => {
  try {
    const lastReset = new Date(lastResetDate);
    const now = new Date();
    
    const resetTime = new Date(now);
    resetTime.setHours(RESET_HOUR, 0, 0, 0);
    
    // If current time is past 5 AM and last reset was before today's 5 AM
    return now >= resetTime && lastReset < resetTime;
  } catch {
    return true;
  }
};

const isSameDay = (date1: string, date2: string): boolean => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  } catch {
    return false;
  }
};

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const defaultDailyStats: DailyStats = {
  shots: 0,
  scoopAndScores: 0,
  beers: 0,
  beerTowers: 0,
  funnels: 0,
  shotguns: 0,
  date: getTodayDateString(),
};

const defaultTotalStats: TotalStats = {
  shots: 0,
  scoopAndScores: 0,
  beers: 0,
  beerTowers: 0,
  funnels: 0,
  shotguns: 0,
};

export const useDailyTrackerStore = create<DailyTrackerState>()(
  persist(
    (set, get) => ({
      dailyStats: defaultDailyStats,
      totalStats: defaultTotalStats,
      lastResetDate: new Date().toISOString(),
      lastDrunkScaleDate: undefined,
      
      updateDailyStat: (stat, increment) => {
        get().resetDailyStatsIfNeeded();
        
        set((state) => {
          const currentValue = state.dailyStats[stat] || 0;
          const newDailyValue = Math.max(0, currentValue + increment);
          const totalIncrement = newDailyValue - currentValue;
          
          // Award XP for the increment
          if (totalIncrement > 0) {
            const xpPerItem = XP_VALUES[stat] || 0;
            const totalXP = xpPerItem * totalIncrement;
            
            // Get user profile store and award XP
            if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
              const userStore = (window as any).__userProfileStore.getState();
              if (userStore && userStore.awardXP) {
                userStore.awardXP(stat, `${totalIncrement} ${stat} tracked`, undefined);
              }
            }
          }
          
          const currentTotalValue = state.totalStats[stat] || 0;
          
          return {
            dailyStats: {
              ...state.dailyStats,
              [stat]: newDailyValue,
            },
            totalStats: {
              ...state.totalStats,
              [stat]: Math.max(0, currentTotalValue + totalIncrement),
            },
          };
        });
      },
      
      setDrunkScale: (rating) => {
        // Ensure rating is a valid number
        const validRating = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
        const today = new Date().toISOString();
        
        set((state) => ({
          dailyStats: {
            ...state.dailyStats,
            drunkScale: validRating,
          },
          lastDrunkScaleDate: today,
        }));
        
        // Award to user profile store as well
        if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
          const userStore = (window as any).__userProfileStore.getState();
          if (userStore && userStore.addDrunkScaleRating) {
            userStore.addDrunkScaleRating(validRating);
          }
        }
      },
      
      canSubmitDrunkScale: () => {
        const { lastDrunkScaleDate } = get();
        const today = new Date().toISOString();
        return !lastDrunkScaleDate || !isSameDay(lastDrunkScaleDate, today);
      },
      
      resetDailyStatsIfNeeded: () => {
        const { lastResetDate } = get();
        
        if (shouldResetDaily(lastResetDate)) {
          set({
            dailyStats: {
              ...defaultDailyStats,
              date: getTodayDateString(),
            },
            lastResetDate: new Date().toISOString(),
          });
        }
      },
      
      getDailyTotal: () => {
        const { dailyStats } = get();
        return Object.entries(dailyStats).reduce((sum, [key, value]) => {
          if (key !== 'date' && key !== 'drunkScale' && typeof value === 'number' && !isNaN(value)) {
            return sum + value;
          }
          return sum;
        }, 0);
      },
      
      getTotalCount: () => {
        const { totalStats } = get();
        return Object.values(totalStats).reduce((sum, value) => {
          const validValue = typeof value === 'number' && !isNaN(value) ? value : 0;
          return sum + validValue;
        }, 0);
      },
      
      awardXPForStats: () => {
        // This method can be used to award XP for daily stats
        // Implementation depends on how you want to integrate with user profile
      },
      
      resetAllStats: () => {
        set({
          dailyStats: {
            ...defaultDailyStats,
            date: getTodayDateString(),
          },
          totalStats: defaultTotalStats,
          lastResetDate: new Date().toISOString(),
          lastDrunkScaleDate: undefined,
        });
      },
    }),
    {
      name: 'daily-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);