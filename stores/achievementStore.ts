import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  category: 'bars' | 'activities' | 'social' | 'milestones';
  completed: boolean;
  completedAt?: string;
  icon: string;
  progress?: number;
  maxProgress?: number;
  order: number;
  level: number;
  maxLevel: number;
  baseId: string;
}

export interface CompletedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'bars' | 'activities' | 'social' | 'milestones';
  completedAt: string;
  level: number;
  baseId: string;
}

interface AchievementState {
  achievements: Achievement[];
  completedAchievements: CompletedAchievement[];
  lastPopupDate?: string;
  isInitialized: boolean;
  canShowPopup: () => boolean;
  shouldShow3AMPopup: () => boolean;
  mark3AMPopupShown: () => void;
  initializeAchievements: () => void;
  completeAchievement: (id: string) => void;
  markPopupShown: () => void;
  getCompletedCount: () => number;
  getAchievementsByCategory: (category: Achievement['category']) => Achievement[];
  getCompletedAchievementsByCategory: (category: Achievement['category']) => CompletedAchievement[];
  resetAchievements: () => void;
  updateAchievementProgress: (baseId: string, progress: number) => void;
  getCurrentLevelAchievements: () => Achievement[];
  checkAndUpdateMultiLevelAchievements: (stats: {
    totalBeers: number;
    totalShots: number;
    totalBeerTowers: number;
    totalScoopAndScores: number;
    totalFunnels: number;
    totalShotguns: number;
    poolGamesWon: number;
    dartGamesWon: number;
    barsHit: number;
    nightsOut: number;
  }) => void;
}

const createAchievementLevels = (
  baseId: string,
  baseName: string,
  category: Achievement['category'],
  icon: string,
  levels: { threshold: number; title: string; description: string }[],
  order: number
): Achievement[] => {
  return levels.map((level, index) => ({
    id: `${baseId}-level-${index + 1}`,
    baseId,
    title: level.title,
    description: level.description,
    detailedDescription: `Complete ${level.threshold} ${baseName.toLowerCase()} to earn this achievement.`,
    category,
    completed: false,
    icon,
    progress: 0,
    maxProgress: level.threshold,
    order,
    level: index + 1,
    maxLevel: levels.length,
  }));
};

const defaultAchievements: Achievement[] = [
  // Bars Visited Achievements
  ...createAchievementLevels(
    'bars-visited',
    'Bars Visited',
    'bars',
    '🏛️',
    [
      { threshold: 5, title: 'Bar Explorer', description: 'Visited 5 different bars' },
      { threshold: 15, title: 'Bar Adventurer', description: 'Visited 15 different bars' },
      { threshold: 30, title: 'Bar Enthusiast', description: 'Visited 30 different bars' },
      { threshold: 50, title: 'Bar Connoisseur', description: 'Visited 50 different bars' },
      { threshold: 100, title: 'Bar Legend', description: 'Visited 100 different bars' },
    ],
    1
  ),

  // Nights Out Achievements
  ...createAchievementLevels(
    'nights-out',
    'Nights Out',
    'milestones',
    '🌙',
    [
      { threshold: 10, title: 'Night Owl', description: 'Completed 10 nights out' },
      { threshold: 25, title: 'Party Goer', description: 'Completed 25 nights out' },
      { threshold: 50, title: 'Social Butterfly', description: 'Completed 50 nights out' },
      { threshold: 75, title: 'Nightlife Aficionado', description: 'Completed 75 nights out' },
      { threshold: 100, title: 'Nightlife Legend', description: 'Completed 100 nights out' },
    ],
    2
  ),

  // Beers Achievements
  ...createAchievementLevels(
    'beers',
    'Beers',
    'activities',
    '🍺',
    [
      { threshold: 10, title: 'Beer Rookie', description: 'Consumed 10 beers' },
      { threshold: 25, title: 'Beer Enthusiast', description: 'Consumed 25 beers' },
      { threshold: 50, title: 'Beer Pro', description: 'Consumed 50 beers' },
      { threshold: 100, title: 'Beer Master', description: 'Consumed 100 beers' },
      { threshold: 200, title: 'Beer Champion', description: 'Consumed 200 beers' },
    ],
    3
  ),

  // Shots Achievements
  ...createAchievementLevels(
    'shots',
    'Shots',
    'activities',
    '🥃',
    [
      { threshold: 10, title: 'Shot Rookie', description: 'Took 10 shots' },
      { threshold: 25, title: 'Shot Enthusiast', description: 'Took 25 shots' },
      { threshold: 50, title: 'Shot Pro', description: 'Took 50 shots' },
      { threshold: 100, title: 'Shot Master', description: 'Took 100 shots' },
      { threshold: 200, title: 'Shot Champion', description: 'Took 200 shots' },
    ],
    4
  ),

  // Beer Towers Achievements
  ...createAchievementLevels(
    'beer-towers',
    'Beer Towers',
    'activities',
    '🗼',
    [
      { threshold: 5, title: 'Tower Rookie', description: 'Consumed 5 beer towers' },
      { threshold: 15, title: 'Tower Enthusiast', description: 'Consumed 15 beer towers' },
      { threshold: 30, title: 'Tower Pro', description: 'Consumed 30 beer towers' },
      { threshold: 50, title: 'Tower Master', description: 'Consumed 50 beer towers' },
      { threshold: 75, title: 'Tower Champion', description: 'Consumed 75 beer towers' },
    ],
    5
  ),

  // Scoop and Scores Achievements
  ...createAchievementLevels(
    'scoop-and-scores',
    'Scoop and Scores',
    'activities',
    '🍻',
    [
      { threshold: 10, title: 'Rookie Scooper', description: 'Consumed 10 Scoop and Scores' },
      { threshold: 25, title: 'Scoop Enthusiast', description: 'Consumed 25 Scoop and Scores' },
      { threshold: 50, title: 'Scoop Pro', description: 'Consumed 50 Scoop and Scores' },
      { threshold: 100, title: 'Scoop Master', description: 'Consumed 100 Scoop and Scores' },
      { threshold: 200, title: 'Scoop Champion', description: 'Consumed 200 Scoop and Scores' },
    ],
    6
  ),

  // Funnels Achievements
  ...createAchievementLevels(
    'funnels',
    'Funnels',
    'activities',
    '🌪️',
    [
      { threshold: 5, title: 'Funnel Novice', description: 'Completed 5 funnels' },
      { threshold: 15, title: 'Funnel Enthusiast', description: 'Completed 15 funnels' },
      { threshold: 30, title: 'Funnel Pro', description: 'Completed 30 funnels' },
      { threshold: 50, title: 'Funnel Master', description: 'Completed 50 funnels' },
      { threshold: 75, title: 'Funnel Champion', description: 'Completed 75 funnels' },
    ],
    7
  ),

  // Shotguns Achievements
  ...createAchievementLevels(
    'shotguns',
    'Shotguns',
    'activities',
    '💥',
    [
      { threshold: 10, title: 'Shotgun Novice', description: 'Completed 10 shotguns' },
      { threshold: 25, title: 'Shotgun Enthusiast', description: 'Completed 25 shotguns' },
      { threshold: 50, title: 'Shotgun Pro', description: 'Completed 50 shotguns' },
      { threshold: 75, title: 'Shotgun Master', description: 'Completed 75 shotguns' },
      { threshold: 100, title: 'Shotgun Champion', description: 'Completed 100 shotguns' },
    ],
    8
  ),

  // Pool Games Won Achievements
  ...createAchievementLevels(
    'pool-games',
    'Pool Games Won',
    'activities',
    '🎱',
    [
      { threshold: 5, title: 'Pool Rookie', description: 'Won 5 pool games' },
      { threshold: 15, title: 'Pool Enthusiast', description: 'Won 15 pool games' },
      { threshold: 30, title: 'Pool Pro', description: 'Won 30 pool games' },
      { threshold: 50, title: 'Pool Master', description: 'Won 50 pool games' },
      { threshold: 75, title: 'Pool Champion', description: 'Won 75 pool games' },
    ],
    9
  ),

  // Dart Games Won Achievements
  ...createAchievementLevels(
    'dart-games',
    'Dart Games Won',
    'activities',
    '🎯',
    [
      { threshold: 5, title: 'Dart Rookie', description: 'Won 5 dart games' },
      { threshold: 15, title: 'Dart Enthusiast', description: 'Won 15 dart games' },
      { threshold: 30, title: 'Dart Pro', description: 'Won 30 dart games' },
      { threshold: 50, title: 'Dart Master', description: 'Won 50 dart games' },
      { threshold: 75, title: 'Dart Champion', description: 'Won 75 dart games' },
    ],
    10
  ),

  // Social Achievements
  {
    id: 'made-new-friend',
    baseId: 'made-new-friend',
    title: 'Social Butterfly',
    description: 'Made a new friend at the bar',
    detailedDescription: 'Strike up a conversation and make a new friend! The best nights often start with meeting new people.',
    category: 'social',
    completed: false,
    icon: '🤝',
    order: 11,
    level: 1,
    maxLevel: 1,
  },

  // Milestone Achievements
  {
    id: 'first-night-out',
    baseId: 'first-night-out',
    title: 'First Night Out',
    description: 'Completed your first night out',
    detailedDescription: 'Welcome to BarBuddy! This marks the beginning of your nightlife journey. Many more adventures await!',
    category: 'milestones',
    completed: false,
    icon: '🌟',
    order: 12,
    level: 1,
    maxLevel: 1,
  },
];

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

const isThreeAM = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  return hour === 3;
};

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: [],
      completedAchievements: [],
      lastPopupDate: undefined,
      isInitialized: false,

      canShowPopup: () => {
        try {
          const { lastPopupDate } = get();
          const today = new Date().toISOString();
          
          if (lastPopupDate && isSameDay(lastPopupDate, today)) {
            return false;
          }
          
          return true;
        } catch (error) {
          console.warn('Error checking popup availability:', error);
          return false;
        }
      },

      shouldShow3AMPopup: () => {
        try {
          const { lastPopupDate } = get();
          const today = new Date().toISOString();
          
          if (!isThreeAM()) return false;
          
          if (lastPopupDate && isSameDay(lastPopupDate, today)) {
            return false;
          }
          
          return true;
        } catch (error) {
          console.warn('Error checking 3AM popup:', error);
          return false;
        }
      },

      mark3AMPopupShown: () => {
        try {
          set({ lastPopupDate: new Date().toISOString() });
        } catch (error) {
          console.warn('Error marking 3AM popup shown:', error);
        }
      },

      initializeAchievements: () => {
        try {
          const { achievements } = get();
          if (achievements.length === 0) {
            set({ achievements: defaultAchievements, isInitialized: true });
          } else {
            set({ isInitialized: true });
          }
        } catch (error) {
          console.warn('Error initializing achievements:', error);
          set({ achievements: defaultAchievements, isInitialized: true });
        }
      },

      completeAchievement: (id: string) => {
        try {
          set((state) => {
            const achievement = state.achievements.find(a => a.id === id);
            if (!achievement || achievement.completed) return state;

            const completedAchievement: CompletedAchievement = {
              id: achievement.id,
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              category: achievement.category,
              completedAt: new Date().toISOString(),
              level: achievement.level,
              baseId: achievement.baseId,
            };

            // Remove any lower level completed achievements of the same type
            const filteredCompletedAchievements = state.completedAchievements.filter(
              ca => ca.baseId !== achievement.baseId
            );

            // Mark current achievement as completed
            const updatedAchievements = state.achievements.map(a =>
              a.id === id ? { ...a, completed: true, completedAt: new Date().toISOString() } : a
            );

            return {
              achievements: updatedAchievements,
              completedAchievements: [...filteredCompletedAchievements, completedAchievement],
            };
          });
        } catch (error) {
          console.warn('Error completing achievement:', error);
        }
      },

      updateAchievementProgress: (baseId: string, progress: number) => {
        try {
          set((state) => {
            // Find the current level achievement for this baseId
            const currentAchievement = state.achievements.find(a => 
              a.baseId === baseId && !a.completed
            );

            if (!currentAchievement) return state;

            const updatedAchievements = state.achievements.map(achievement => {
              if (achievement.id === currentAchievement.id) {
                const newProgress = Math.min(progress, achievement.maxProgress || 0);
                const shouldComplete = achievement.maxProgress && newProgress >= achievement.maxProgress;
                
                return {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete || false,
                  completedAt: shouldComplete ? new Date().toISOString() : achievement.completedAt,
                };
              }
              return achievement;
            });

            // Check if we completed the current level
            const completedAchievement = updatedAchievements.find(a => 
              a.id === currentAchievement.id && a.completed && !currentAchievement.completed
            );

            let newCompletedAchievements = state.completedAchievements;

            if (completedAchievement) {
              const completedAchievementData: CompletedAchievement = {
                id: completedAchievement.id,
                title: completedAchievement.title,
                description: completedAchievement.description,
                icon: completedAchievement.icon,
                category: completedAchievement.category,
                completedAt: completedAchievement.completedAt!,
                level: completedAchievement.level,
                baseId: completedAchievement.baseId,
              };

              // Remove any lower level completed achievements of the same type
              const filteredCompletedAchievements = state.completedAchievements.filter(
                ca => ca.baseId !== baseId
              );

              newCompletedAchievements = [...filteredCompletedAchievements, completedAchievementData];
            }

            return {
              achievements: updatedAchievements,
              completedAchievements: newCompletedAchievements,
            };
          });
        } catch (error) {
          console.warn('Error updating achievement progress:', error);
        }
      },

      checkAndUpdateMultiLevelAchievements: (stats) => {
        try {
          const { updateAchievementProgress } = get();
          
          // Update all achievement progress
          updateAchievementProgress('bars-visited', stats.barsHit);
          updateAchievementProgress('nights-out', stats.nightsOut);
          updateAchievementProgress('beers', stats.totalBeers);
          updateAchievementProgress('shots', stats.totalShots);
          updateAchievementProgress('beer-towers', stats.totalBeerTowers);
          updateAchievementProgress('scoop-and-scores', stats.totalScoopAndScores);
          updateAchievementProgress('funnels', stats.totalFunnels);
          updateAchievementProgress('shotguns', stats.totalShotguns);
          updateAchievementProgress('pool-games', stats.poolGamesWon);
          updateAchievementProgress('dart-games', stats.dartGamesWon);
        } catch (error) {
          console.warn('Error checking and updating achievements:', error);
        }
      },

      markPopupShown: () => {
        try {
          set({ lastPopupDate: new Date().toISOString() });
        } catch (error) {
          console.warn('Error marking popup shown:', error);
        }
      },

      getCompletedCount: () => {
        try {
          const { completedAchievements } = get();
          return completedAchievements?.length || 0;
        } catch (error) {
          console.warn('Error getting completed count:', error);
          return 0;
        }
      },

      getAchievementsByCategory: (category: Achievement['category']) => {
        try {
          const { achievements } = get();
          return (achievements || [])
            .filter(a => a.category === category && !a.completed)
            .sort((a, b) => a.order - b.order);
        } catch (error) {
          console.warn('Error getting achievements by category:', error);
          return [];
        }
      },

      getCompletedAchievementsByCategory: (category: Achievement['category']) => {
        try {
          const { completedAchievements } = get();
          return (completedAchievements || [])
            .filter(a => a.category === category)
            .sort((a, b) => a.level - b.level);
        } catch (error) {
          console.warn('Error getting completed achievements by category:', error);
          return [];
        }
      },

      getCurrentLevelAchievements: () => {
        try {
          const { achievements } = get();
          
          if (!achievements || achievements.length === 0) return [];
          
          // Get all unique baseIds
          const allBaseIds = [...new Set(achievements.map(a => a.baseId))];
          
          // For each baseId, find the current level (lowest incomplete level)
          const currentLevelAchievements: Achievement[] = [];
          
          allBaseIds.forEach(baseId => {
            const achievementsForBase = achievements
              .filter(a => a.baseId === baseId)
              .sort((a, b) => a.level - b.level);
            
            // Find the first incomplete achievement for this base
            const currentLevel = achievementsForBase.find(a => !a.completed);
            
            if (currentLevel) {
              currentLevelAchievements.push(currentLevel);
            }
          });
          
          return currentLevelAchievements.sort((a, b) => a.order - b.order);
        } catch (error) {
          console.warn('Error getting current level achievements:', error);
          return [];
        }
      },

      resetAchievements: () => {
        try {
          set({
            achievements: defaultAchievements.map(a => ({ 
              ...a, 
              completed: false, 
              completedAt: undefined,
              progress: a.maxProgress ? 0 : undefined
            })),
            completedAchievements: [],
            lastPopupDate: undefined,
            isInitialized: true,
          });
        } catch (error) {
          console.warn('Error resetting achievements:', error);
        }
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Safe hook that handles cases where the store might not be initialized
export const useAchievementStoreSafe = () => {
  try {
    const store = useAchievementStore();
    
    // Return a safe version of the store with fallback values
    return {
      achievements: store?.achievements || [],
      completedAchievements: store?.completedAchievements || [],
      lastPopupDate: store?.lastPopupDate,
      isInitialized: store?.isInitialized || false,
      canShowPopup: store?.canShowPopup || (() => false),
      shouldShow3AMPopup: store?.shouldShow3AMPopup || (() => false),
      mark3AMPopupShown: store?.mark3AMPopupShown || (() => {}),
      initializeAchievements: store?.initializeAchievements || (() => {}),
      completeAchievement: store?.completeAchievement || (() => {}),
      markPopupShown: store?.markPopupShown || (() => {}),
      getCompletedCount: store?.getCompletedCount || (() => 0),
      getAchievementsByCategory: store?.getAchievementsByCategory || (() => []),
      getCompletedAchievementsByCategory: store?.getCompletedAchievementsByCategory || (() => []),
      resetAchievements: store?.resetAchievements || (() => {}),
      updateAchievementProgress: store?.updateAchievementProgress || (() => {}),
      getCurrentLevelAchievements: store?.getCurrentLevelAchievements || (() => []),
      checkAndUpdateMultiLevelAchievements: store?.checkAndUpdateMultiLevelAchievements || (() => {}),
    };
  } catch (error) {
    console.warn('Error accessing achievement store safely:', error);
    
    // Return a completely safe fallback
    return {
      achievements: [],
      completedAchievements: [],
      lastPopupDate: undefined,
      isInitialized: false,
      canShowPopup: () => false,
      shouldShow3AMPopup: () => false,
      mark3AMPopupShown: () => {},
      initializeAchievements: () => {},
      completeAchievement: () => {},
      markPopupShown: () => {},
      getCompletedCount: () => 0,
      getAchievementsByCategory: () => [],
      getCompletedAchievementsByCategory: () => [],
      resetAchievements: () => {},
      updateAchievementProgress: () => {},
      getCurrentLevelAchievements: () => [],
      checkAndUpdateMultiLevelAchievements: () => {},
    };
  }
};

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__achievementStore = useAchievementStore;
}