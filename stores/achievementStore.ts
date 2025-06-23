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
    totalPoolGamesWon: number;
    totalDartGamesWon: number;
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

  // Scoop and Scores Achievements
  ...createAchievementLevels(
    'scoop-and-scores',
    'Scoop and Scores',
    'activities',
    '🍺',
    [
      { threshold: 10, title: 'Rookie Scooper', description: 'Consumed 10 Scoop and Scores' },
      { threshold: 25, title: 'Scoop Enthusiast', description: 'Consumed 25 Scoop and Scores' },
      { threshold: 50, title: 'Scoop Pro', description: 'Consumed 50 Scoop and Scores' },
      { threshold: 100, title: 'Scoop Master', description: 'Consumed 100 Scoop and Scores' },
      { threshold: 200, title: 'Scoop Champion', description: 'Consumed 200 Scoop and Scores' },
    ],
    3
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
    4
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
    5
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
    6
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
    7
  ),

  // Photo Achievements
  ...createAchievementLevels(
    'photos-taken',
    'Photos Taken',
    'activities',
    '📸',
    [
      { threshold: 10, title: 'Photo Enthusiast', description: 'Took 10 photos' },
      { threshold: 50, title: 'Photo Master', description: 'Took 50 photos' },
      { threshold: 100, title: 'Photo Pro', description: 'Took 100 photos' },
      { threshold: 250, title: 'Photo Legend', description: 'Took 250 photos' },
      { threshold: 500, title: 'Photo Champion', description: 'Took 500 photos' },
    ],
    8
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
    order: 9,
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
    order: 10,
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

      canShowPopup: () => {
        const { lastPopupDate } = get();
        const today = new Date().toISOString();
        
        if (lastPopupDate && isSameDay(lastPopupDate, today)) {
          return false;
        }
        
        return true;
      },

      shouldShow3AMPopup: () => {
        const { lastPopupDate } = get();
        const today = new Date().toISOString();
        
        if (!isThreeAM()) return false;
        
        if (lastPopupDate && isSameDay(lastPopupDate, today)) {
          return false;
        }
        
        return true;
      },

      mark3AMPopupShown: () => {
        set({ lastPopupDate: new Date().toISOString() });
      },

      initializeAchievements: () => {
        const { achievements } = get();
        if (achievements.length === 0) {
          set({ achievements: defaultAchievements });
        }
      },

      completeAchievement: (id: string) => {
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
      },

      updateAchievementProgress: (baseId: string, progress: number) => {
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
      },

      checkAndUpdateMultiLevelAchievements: (stats) => {
        const { updateAchievementProgress } = get();
        
        // Update all achievement progress
        updateAchievementProgress('bars-visited', stats.barsHit);
        updateAchievementProgress('nights-out', stats.nightsOut);
        updateAchievementProgress('scoop-and-scores', stats.totalScoopAndScores);
        updateAchievementProgress('funnels', stats.totalFunnels);
        updateAchievementProgress('shotguns', stats.totalShotguns);
        updateAchievementProgress('pool-games', stats.totalPoolGamesWon);
        updateAchievementProgress('dart-games', stats.totalDartGamesWon);
      },

      markPopupShown: () => {
        set({ lastPopupDate: new Date().toISOString() });
      },

      getCompletedCount: () => {
        const { completedAchievements } = get();
        return completedAchievements.length;
      },

      getAchievementsByCategory: (category: Achievement['category']) => {
        const { achievements } = get();
        return achievements
          .filter(a => a.category === category && !a.completed)
          .sort((a, b) => a.order - b.order);
      },

      getCompletedAchievementsByCategory: (category: Achievement['category']) => {
        const { completedAchievements } = get();
        return completedAchievements
          .filter(a => a.category === category)
          .sort((a, b) => a.level - b.level);
      },

      getCurrentLevelAchievements: () => {
        const { achievements } = get();
        
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
      },

      resetAchievements: () => {
        set({
          achievements: defaultAchievements.map(a => ({ 
            ...a, 
            completed: false, 
            completedAt: undefined,
            progress: a.maxProgress ? 0 : undefined
          })),
          completedAchievements: [],
          lastPopupDate: undefined,
        });
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Update photo achievements when photos are taken
if (typeof window !== 'undefined') {
  (window as any).__achievementStore = useAchievementStore;
}