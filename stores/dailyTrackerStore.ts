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
  updateDailyStats: (stats: Partial<Omit<DailyStats, 'date'>>) => void;
  resetDailyStats: () => void;
  getDailyStats: () => DailyStats;
  getTotalStats: () => TotalStats;
}

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
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

      updateDailyStats: (stats) => {
        const today = getTodayString();
        
        set((state) => {
          const isToday = state.dailyStats.date === today;
          
          if (!isToday) {
            // Reset daily stats for new day
            const newDailyStats: DailyStats = {
              shots: stats.shots || 0,
              scoopAndScores: stats.scoopAndScores || 0,
              beers: stats.beers || 0,
              beerTowers: stats.beerTowers || 0,
              funnels: stats.funnels || 0,
              shotguns: stats.shotguns || 0,
              poolGamesWon: stats.poolGamesWon || 0,
              dartGamesWon: stats.dartGamesWon || 0,
              date: today,
            };
            
            const newTotalStats: TotalStats = {
              shots: state.totalStats.shots + (stats.shots || 0),
              scoopAndScores: state.totalStats.scoopAndScores + (stats.scoopAndScores || 0),
              beers: state.totalStats.beers + (stats.beers || 0),
              beerTowers: state.totalStats.beerTowers + (stats.beerTowers || 0),
              funnels: state.totalStats.funnels + (stats.funnels || 0),
              shotguns: state.totalStats.shotguns + (stats.shotguns || 0),
              poolGamesWon: state.totalStats.poolGamesWon + (stats.poolGamesWon || 0),
              dartGamesWon: state.totalStats.dartGamesWon + (stats.dartGamesWon || 0),
            };
            
            return {
              dailyStats: newDailyStats,
              totalStats: newTotalStats,
            };
          } else {
            // Update existing daily stats
            const updatedDailyStats: DailyStats = {
              ...state.dailyStats,
              shots: stats.shots !== undefined ? stats.shots : state.dailyStats.shots,
              scoopAndScores: stats.scoopAndScores !== undefined ? stats.scoopAndScores : state.dailyStats.scoopAndScores,
              beers: stats.beers !== undefined ? stats.beers : state.dailyStats.beers,
              beerTowers: stats.beerTowers !== undefined ? stats.beerTowers : state.dailyStats.beerTowers,
              funnels: stats.funnels !== undefined ? stats.funnels : state.dailyStats.funnels,
              shotguns: stats.shotguns !== undefined ? stats.shotguns : state.dailyStats.shotguns,
              poolGamesWon: stats.poolGamesWon !== undefined ? stats.poolGamesWon : state.dailyStats.poolGamesWon,
              dartGamesWon: stats.dartGamesWon !== undefined ? stats.dartGamesWon : state.dailyStats.dartGamesWon,
            };
            
            // Calculate the difference for total stats
            const shotsDiff = (stats.shots !== undefined) ? Math.max(0, stats.shots - state.dailyStats.shots) : 0;
            const scoopDiff = (stats.scoopAndScores !== undefined) ? Math.max(0, stats.scoopAndScores - state.dailyStats.scoopAndScores) : 0;
            const beersDiff = (stats.beers !== undefined) ? Math.max(0, stats.beers - state.dailyStats.beers) : 0;
            const beerTowersDiff = (stats.beerTowers !== undefined) ? Math.max(0, stats.beerTowers - state.dailyStats.beerTowers) : 0;
            const funnelsDiff = (stats.funnels !== undefined) ? Math.max(0, stats.funnels - state.dailyStats.funnels) : 0;
            const shotgunsDiff = (stats.shotguns !== undefined) ? Math.max(0, stats.shotguns - state.dailyStats.shotguns) : 0;
            const poolDiff = (stats.poolGamesWon !== undefined) ? Math.max(0, stats.poolGamesWon - state.dailyStats.poolGamesWon) : 0;
            const dartDiff = (stats.dartGamesWon !== undefined) ? Math.max(0, stats.dartGamesWon - state.dailyStats.dartGamesWon) : 0;
            
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
            
            return {
              dailyStats: updatedDailyStats,
              totalStats: updatedTotalStats,
            };
          }
        });
      },

      resetDailyStats: () => {
        set({
          dailyStats: { ...defaultDailyStats, date: getTodayString() },
        });
      },

      getDailyStats: () => {
        const { dailyStats } = get();
        const today = getTodayString();
        
        if (dailyStats.date === today) {
          return dailyStats;
        }
        
        return { ...defaultDailyStats, date: today };
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