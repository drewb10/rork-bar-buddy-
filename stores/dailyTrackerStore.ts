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
  updateDailyStat: (stat: keyof Omit<DailyStats, 'date'>, increment: number) => void;
  resetDailyStatsIfNeeded: () => void;
  getDailyTotal: () => number;
  getTotalCount: () => number;
  resetAllStats: () => void;
}

const RESET_HOUR = 5; // 5 AM

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
      
      updateDailyStat: (stat, increment) => {
        get().resetDailyStatsIfNeeded();
        
        set((state) => {
          const newDailyValue = Math.max(0, state.dailyStats[stat] + increment);
          const totalIncrement = newDailyValue - state.dailyStats[stat];
          
          return {
            dailyStats: {
              ...state.dailyStats,
              [stat]: newDailyValue,
            },
            totalStats: {
              ...state.totalStats,
              [stat]: Math.max(0, state.totalStats[stat] + totalIncrement),
            },
          };
        });
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
        return Object.values(dailyStats).reduce((sum, value) => {
          return typeof value === 'number' ? sum + value : sum;
        }, 0);
      },
      
      getTotalCount: () => {
        const { totalStats } = get();
        return Object.values(totalStats).reduce((sum, value) => sum + value, 0);
      },
      
      resetAllStats: () => {
        set({
          dailyStats: {
            ...defaultDailyStats,
            date: getTodayDateString(),
          },
          totalStats: defaultTotalStats,
          lastResetDate: new Date().toISOString(),
        });
      },
    }),
    {
      name: 'daily-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);