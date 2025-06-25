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
  drunkScaleSubmitted: boolean;
  drunkScaleRating?: number;
  drunkScaleTimestamp?: string;
  lastDrunkScaleSubmission?: string;
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
  updateDailyStats: (stats: Partial<DailyStats>) => void;
  submitDrunkScale: (rating: number) => void;
  resetDailyStats: () => void;
  getDailyStats: () => DailyStats;
  getTotalStats: () => TotalStats;
  checkAndResetIfNeeded: () => void;
  canSubmitDrunkScale: () => boolean;
  hasDrunkScaleForToday: () => boolean;
}

const RESET_HOUR = 5;
const LIKE_RESET_HOUR = 4;
const LIKE_RESET_MINUTE = 59;
const INTERACTION_COOLDOWN_HOURS = 2;
const DAILY_LIKE_LIMIT = 1; // 1 like per bar per day

const shouldReset = (lastReset: string): boolean => {
  try {
    const lastResetDate = new Date(lastReset);
    const now = new Date();
    
    const resetTime = new Date(now);
    resetTime.setHours(RESET_HOUR, 0, 0, 0);
    
    return now >= resetTime && lastResetDate < resetTime;
  } catch {
    return false;
  }
};

const shouldResetLikes = (lastLikeReset: string): boolean => {
  try {
    const lastResetDate = new Date(lastLikeReset);
    const now = new Date();
    
    // Reset at 4:59 AM
    const resetTime = new Date(now);
    resetTime.setHours(LIKE_RESET_HOUR, LIKE_RESET_MINUTE, 0, 0);
    
    // If it's past 4:59 AM today and last reset was before today's 4:59 AM, reset
    if (now >= resetTime && lastResetDate < resetTime) {
      return true;
    }
    
    // If it's before 4:59 AM today, check if last reset was before yesterday's 4:59 AM
    if (now < resetTime) {
      const yesterdayResetTime = new Date(resetTime);
      yesterdayResetTime.setDate(yesterdayResetTime.getDate() - 1);
      return lastResetDate < yesterdayResetTime;
    }
    
    return false;
  } catch {
    return false;
  }
};

const canInteractWithVenue = (lastInteraction: string | undefined): boolean => {
  try {
    if (!lastInteraction) return true;
    
    const lastInteractionDate = new Date(lastInteraction);
    const now = new Date();
    
    const cooldownTime = new Date(lastInteractionDate);
    cooldownTime.setHours(cooldownTime.getHours() + INTERACTION_COOLDOWN_HOURS);
    
    return now >= cooldownTime;
  } catch {
    return true;
  }
};

const canSubmitDrunkScaleToday = (lastSubmission?: string): boolean => {
  if (!lastSubmission) return true;
  
  try {
    const lastSubmissionDate = new Date(lastSubmission);
    const now = new Date();
    
    // Check if 24 hours have passed since last submission
    const timeDiff = now.getTime() - lastSubmissionDate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  } catch {
    return true; // Allow submission if there's an error parsing the date
  }
};

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
  lastResetAt: new Date().toISOString(),
  drunkScaleSubmitted: false,
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
        if (shouldReset(dailyStats.lastResetAt)) {
          get().resetDailyStats();
        }
      },

      updateDailyStats: (stats) => {
        try {
          // Check for reset before updating
          get().checkAndResetIfNeeded();
          
          const today = getTodayString();
          
          set((state) => {
            const currentStats = state.dailyStats || defaultDailyStats;
            
            // Safely handle stats updates with proper defaults
            const newStats: DailyStats = {
              shots: stats.shots !== undefined ? stats.shots : currentStats.shots || 0,
              scoopAndScores: stats.scoopAndScores !== undefined ? stats.scoopAndScores : currentStats.scoopAndScores || 0,
              beers: stats.beers !== undefined ? stats.beers : currentStats.beers || 0,
              beerTowers: stats.beerTowers !== undefined ? stats.beerTowers : currentStats.beerTowers || 0,
              funnels: stats.funnels !== undefined ? stats.funnels : currentStats.funnels || 0,
              shotguns: stats.shotguns !== undefined ? stats.shotguns : currentStats.shotguns || 0,
              poolGamesWon: stats.poolGamesWon !== undefined ? stats.poolGamesWon : currentStats.poolGamesWon || 0,
              dartGamesWon: stats.dartGamesWon !== undefined ? stats.dartGamesWon : currentStats.dartGamesWon || 0,
              date: today,
              lastResetAt: currentStats.lastResetAt || new Date().toISOString(),
              drunkScaleSubmitted: currentStats.drunkScaleSubmitted || false,
              drunkScaleRating: currentStats.drunkScaleRating,
              drunkScaleTimestamp: currentStats.drunkScaleTimestamp,
              lastDrunkScaleSubmission: currentStats.lastDrunkScaleSubmission,
            };
            
            // Calculate the differences to avoid double counting
            const shotsDiff = Math.max(0, newStats.shots - (currentStats.shots || 0));
            const scoopDiff = Math.max(0, newStats.scoopAndScores - (currentStats.scoopAndScores || 0));
            const beersDiff = Math.max(0, newStats.beers - (currentStats.beers || 0));
            const beerTowersDiff = Math.max(0, newStats.beerTowers - (currentStats.beerTowers || 0));
            const funnelsDiff = Math.max(0, newStats.funnels - (currentStats.funnels || 0));
            const shotgunsDiff = Math.max(0, newStats.shotguns - (currentStats.shotguns || 0));
            const poolDiff = Math.max(0, newStats.poolGamesWon - (currentStats.poolGamesWon || 0));
            const dartDiff = Math.max(0, newStats.dartGamesWon - (currentStats.dartGamesWon || 0));
            
            const updatedTotalStats: TotalStats = {
              shots: (state.totalStats?.shots || 0) + shotsDiff,
              scoopAndScores: (state.totalStats?.scoopAndScores || 0) + scoopDiff,
              beers: (state.totalStats?.beers || 0) + beersDiff,
              beerTowers: (state.totalStats?.beerTowers || 0) + beerTowersDiff,
              funnels: (state.totalStats?.funnels || 0) + funnelsDiff,
              shotguns: (state.totalStats?.shotguns || 0) + shotgunsDiff,
              poolGamesWon: (state.totalStats?.poolGamesWon || 0) + poolDiff,
              dartGamesWon: (state.totalStats?.dartGamesWon || 0) + dartDiff,
            };
            
            // Update achievements if there are any increases
            if (typeof window !== 'undefined' && (window as any).__achievementStore) {
              const achievementStore = (window as any).__achievementStore;
              if (achievementStore?.getState) {
                const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
                if (typeof checkAndUpdateMultiLevelAchievements === 'function') {
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
            }
            
            return {
              dailyStats: newStats,
              totalStats: updatedTotalStats,
            };
          });
        } catch (error) {
          console.warn('Error updating daily stats:', error);
        }
      },

      submitDrunkScale: (rating: number) => {
        get().checkAndResetIfNeeded();
        
        const today = getTodayString();
        const now = new Date().toISOString();
        
        set((state) => {
          const updatedDailyStats: DailyStats = {
            ...state.dailyStats,
            date: today,
            drunkScaleSubmitted: true,
            drunkScaleRating: rating,
            drunkScaleTimestamp: now,
            lastDrunkScaleSubmission: now,
          };
          
          return {
            dailyStats: updatedDailyStats,
          };
        });

        // Update user profile store with drunk scale rating
        if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
          const userProfileStore = (window as any).__userProfileStore;
          if (userProfileStore?.getState) {
            const { addDrunkScaleRating } = userProfileStore.getState();
            if (typeof addDrunkScaleRating === 'function') {
              addDrunkScaleRating(rating);
            }
          }
        }
      },

      resetDailyStats: () => {
        const { dailyStats } = get();
        set({
          dailyStats: { 
            ...defaultDailyStats, 
            date: getTodayString(),
            lastResetAt: new Date().toISOString(),
            // Preserve drunk scale submission status if it was submitted today
            drunkScaleSubmitted: canSubmitDrunkScaleToday(dailyStats.lastDrunkScaleSubmission) ? false : dailyStats.drunkScaleSubmitted,
            drunkScaleRating: canSubmitDrunkScaleToday(dailyStats.lastDrunkScaleSubmission) ? undefined : dailyStats.drunkScaleRating,
            drunkScaleTimestamp: canSubmitDrunkScaleToday(dailyStats.lastDrunkScaleSubmission) ? undefined : dailyStats.drunkScaleTimestamp,
            lastDrunkScaleSubmission: dailyStats.lastDrunkScaleSubmission,
          },
        });
      },

      getDailyStats: () => {
        get().checkAndResetIfNeeded();
        const { dailyStats } = get();
        const today = getTodayString();
        
        if (dailyStats && dailyStats.date === today) {
          return dailyStats;
        }
        
        return { 
          ...defaultDailyStats, 
          date: today,
          lastResetAt: new Date().toISOString(),
        };
      },

      getTotalStats: () => {
        return get().totalStats || defaultTotalStats;
      },

      canSubmitDrunkScale: () => {
        get().checkAndResetIfNeeded();
        const { dailyStats } = get();
        
        // Check if 24 hours have passed since last submission
        return canSubmitDrunkScaleToday(dailyStats?.lastDrunkScaleSubmission);
      },

      hasDrunkScaleForToday: () => {
        get().checkAndResetIfNeeded();
        const { dailyStats } = get();
        
        // Check if user has submitted today and 24 hours haven't passed
        return !canSubmitDrunkScaleToday(dailyStats?.lastDrunkScaleSubmission);
      },
    }),
    {
      name: 'daily-tracker-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);