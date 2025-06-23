import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'bars' | 'activities' | 'social' | 'milestones' | 'special' | 'consumption';
  completed: boolean;
  completedAt?: string;
  icon: string;
  progress?: number;
  maxProgress?: number;
  order: number;
  level?: number;
  isMultiLevel?: boolean;
  nextLevelId?: string;
}

interface AchievementState {
  achievements: Achievement[];
  popupShown: boolean;
  lastPopupDate: string | null;
  initializeAchievements: () => void;
  completeAchievement: (id: string) => void;
  getCompletedCount: () => number;
  resetAchievements: () => void;
  updateAchievementProgress: (id: string, progress: number) => void;
  markPopupShown: () => void;
  shouldShowPopup: () => boolean;
  shouldShow3AMPopup: () => boolean;
  mark3AMPopupShown: () => void;
  checkAndUpdateMultiLevelAchievements: (userStats: { totalBeers: number; totalShots: number; totalBeerTowers: number; }) => void;
}

const defaultAchievements: Achievement[] = [
  // Milestones
  {
    id: 'first-night-out',
    title: 'First Night Out',
    description: 'Completed your first night out with BarBuddy',
    category: 'milestones',
    completed: false,
    icon: '🌟',
    order: 1,
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Went out on both Friday and Saturday',
    category: 'milestones',
    completed: false,
    icon: '⚡',
    order: 2,
  },
  
  // Bar Hopping
  {
    id: 'bar-hopper',
    title: 'Bar Hopper',
    description: 'Visited 2 different bars in one night',
    category: 'bars',
    completed: false,
    icon: '🍺',
    order: 3,
  },
  {
    id: 'three-bars-night',
    title: 'Triple Threat',
    description: 'Went to 3 bars in one night',
    category: 'bars',
    completed: false,
    icon: '🍻',
    progress: 0,
    maxProgress: 3,
    order: 4,
  },
  {
    id: 'venue-explorer',
    title: 'Venue Explorer',
    description: 'Visited 10 different venues',
    category: 'bars',
    completed: false,
    icon: '🗺️',
    progress: 0,
    maxProgress: 10,
    order: 5,
  },
  
  // Multi-Level Beer Achievements
  {
    id: 'beer-beginner',
    title: 'Beer Beginner',
    description: 'Drink 10 beers total',
    category: 'consumption',
    completed: false,
    icon: '🍺',
    progress: 0,
    maxProgress: 10,
    order: 6,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'brew-enthusiast',
  },
  {
    id: 'brew-enthusiast',
    title: 'Brew Enthusiast',
    description: 'Drink 50 beers total',
    category: 'consumption',
    completed: false,
    icon: '🍻',
    progress: 0,
    maxProgress: 50,
    order: 7,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'lager-lover',
  },
  {
    id: 'lager-lover',
    title: 'Lager Lover',
    description: 'Drink 100 beers total',
    category: 'consumption',
    completed: false,
    icon: '🍺',
    progress: 0,
    maxProgress: 100,
    order: 8,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'ale-aficionado',
  },
  {
    id: 'ale-aficionado',
    title: 'Ale Aficionado',
    description: 'Drink 250 beers total',
    category: 'consumption',
    completed: false,
    icon: '🍻',
    progress: 0,
    maxProgress: 250,
    order: 9,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'beer-annihilator',
  },
  {
    id: 'beer-annihilator',
    title: 'Beer Annihilator',
    description: 'Drink 500 beers total',
    category: 'consumption',
    completed: false,
    icon: '🍺',
    progress: 0,
    maxProgress: 500,
    order: 10,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Shot Achievements
  {
    id: 'shot-starter',
    title: 'Shot Starter',
    description: 'Take 10 shots total',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 10,
    order: 11,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'quick-shooter',
  },
  {
    id: 'quick-shooter',
    title: 'Quick Shooter',
    description: 'Take 30 shots total',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 30,
    order: 12,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'shot-pro',
  },
  {
    id: 'shot-pro',
    title: 'Shot Pro',
    description: 'Take 75 shots total',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 75,
    order: 13,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'shot-master',
  },
  {
    id: 'shot-master',
    title: 'Shot Master',
    description: 'Take 150 shots total',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 150,
    order: 14,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'shot-legend',
  },
  {
    id: 'shot-legend',
    title: 'Shot Legend',
    description: 'Take 300 shots total',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 300,
    order: 15,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Beer Tower Achievements
  {
    id: 'tower-rookie',
    title: 'Tower Rookie',
    description: 'Finish 5 beer towers total',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 5,
    order: 16,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'tower-enthusiast',
  },
  {
    id: 'tower-enthusiast',
    title: 'Tower Enthusiast',
    description: 'Finish 15 beer towers total',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 15,
    order: 17,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'tower-master',
  },
  {
    id: 'tower-master',
    title: 'Tower Master',
    description: 'Finish 30 beer towers total',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 30,
    order: 18,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'tower-connoisseur',
  },
  {
    id: 'tower-connoisseur',
    title: 'Tower Connoisseur',
    description: 'Finish 50 beer towers total',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 50,
    order: 19,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'tower-titan',
  },
  {
    id: 'tower-titan',
    title: 'Tower Titan',
    description: 'Finish 100 beer towers total',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 100,
    order: 20,
    level: 5,
    isMultiLevel: true,
  },
  
  // Activities
  {
    id: 'photo-enthusiast',
    title: 'Photo Enthusiast',
    description: 'Took 10 photos during your night out',
    category: 'activities',
    completed: false,
    icon: '📸',
    progress: 0,
    maxProgress: 10,
    order: 21,
  },
  {
    id: 'photo-master',
    title: 'Photo Master',
    description: 'Took 50 photos total',
    category: 'activities',
    completed: false,
    icon: '📷',
    progress: 0,
    maxProgress: 50,
    order: 22,
  },
  {
    id: 'karaoke-star',
    title: 'Karaoke Star',
    description: 'Sang karaoke at a venue',
    category: 'activities',
    completed: false,
    icon: '🎤',
    order: 23,
  },
  {
    id: 'trivia-master',
    title: 'Trivia Master',
    description: 'Participated in trivia night',
    category: 'activities',
    completed: false,
    icon: '🧠',
    order: 24,
  },
  {
    id: 'pool-shark',
    title: 'Pool Shark',
    description: 'Played pool or billiards',
    category: 'activities',
    completed: false,
    icon: '🎱',
    order: 25,
  },
  
  // Social
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Made 5 new connections',
    category: 'social',
    completed: false,
    icon: '🦋',
    progress: 0,
    maxProgress: 5,
    order: 26,
  },
  {
    id: 'conversation-starter',
    title: 'Conversation Starter',
    description: 'Started a chat in a venue',
    category: 'social',
    completed: false,
    icon: '💬',
    order: 27,
  },
  {
    id: 'group-leader',
    title: 'Group Leader',
    description: 'Went out with 5+ friends',
    category: 'social',
    completed: false,
    icon: '👥',
    order: 28,
  },

  // Special Achievement - Trifecta
  {
    id: 'trifecta',
    title: 'Trifecta',
    description: 'Win pool at JBA, darts at The Bird, and take a group shot at Late Nite',
    category: 'special',
    completed: false,
    icon: '🏆',
    order: 29,
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

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: [],
      popupShown: false,
      lastPopupDate: null,

      initializeAchievements: () => {
        const { achievements } = get();
        if (achievements.length === 0) {
          set({ achievements: defaultAchievements });
        }
      },

      completeAchievement: (id: string) => {
        set((state) => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === id
              ? { ...achievement, completed: true, completedAt: new Date().toISOString() }
              : achievement
          )
        }));
      },

      updateAchievementProgress: (id: string, progress: number) => {
        set((state) => ({
          achievements: state.achievements.map(achievement =>
            achievement.id === id
              ? { 
                  ...achievement, 
                  progress,
                  completed: achievement.maxProgress ? progress >= achievement.maxProgress : achievement.completed,
                  completedAt: achievement.maxProgress && progress >= achievement.maxProgress && !achievement.completed 
                    ? new Date().toISOString() 
                    : achievement.completedAt
                }
              : achievement
          )
        }));
      },

      checkAndUpdateMultiLevelAchievements: (userStats: { totalBeers: number; totalShots: number; totalBeerTowers: number; }) => {
        const { achievements } = get();
        let updatedAchievements = [...achievements];
        let hasChanges = false;

        // Check beer achievements
        const beerAchievements = [
          { id: 'beer-beginner', threshold: 10 },
          { id: 'brew-enthusiast', threshold: 50 },
          { id: 'lager-lover', threshold: 100 },
          { id: 'ale-aficionado', threshold: 250 },
          { id: 'beer-annihilator', threshold: 500 },
        ];

        beerAchievements.forEach(({ id, threshold }) => {
          const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
          if (achievementIndex !== -1) {
            const achievement = updatedAchievements[achievementIndex];
            const newProgress = Math.min(userStats.totalBeers, threshold);
            const shouldComplete = userStats.totalBeers >= threshold;

            if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
              updatedAchievements[achievementIndex] = {
                ...achievement,
                progress: newProgress,
                completed: shouldComplete,
                completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
              };
              hasChanges = true;
            }
          }
        });

        // Check shot achievements
        const shotAchievements = [
          { id: 'shot-starter', threshold: 10 },
          { id: 'quick-shooter', threshold: 30 },
          { id: 'shot-pro', threshold: 75 },
          { id: 'shot-master', threshold: 150 },
          { id: 'shot-legend', threshold: 300 },
        ];

        shotAchievements.forEach(({ id, threshold }) => {
          const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
          if (achievementIndex !== -1) {
            const achievement = updatedAchievements[achievementIndex];
            const newProgress = Math.min(userStats.totalShots, threshold);
            const shouldComplete = userStats.totalShots >= threshold;

            if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
              updatedAchievements[achievementIndex] = {
                ...achievement,
                progress: newProgress,
                completed: shouldComplete,
                completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
              };
              hasChanges = true;
            }
          }
        });

        // Check beer tower achievements
        const towerAchievements = [
          { id: 'tower-rookie', threshold: 5 },
          { id: 'tower-enthusiast', threshold: 15 },
          { id: 'tower-master', threshold: 30 },
          { id: 'tower-connoisseur', threshold: 50 },
          { id: 'tower-titan', threshold: 100 },
        ];

        towerAchievements.forEach(({ id, threshold }) => {
          const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
          if (achievementIndex !== -1) {
            const achievement = updatedAchievements[achievementIndex];
            const newProgress = Math.min(userStats.totalBeerTowers, threshold);
            const shouldComplete = userStats.totalBeerTowers >= threshold;

            if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
              updatedAchievements[achievementIndex] = {
                ...achievement,
                progress: newProgress,
                completed: shouldComplete,
                completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
              };
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          set({ achievements: updatedAchievements });
        }
      },

      getCompletedCount: () => {
        const { achievements } = get();
        return achievements.filter(a => a.completed).length;
      },

      resetAchievements: () => {
        set({
          achievements: defaultAchievements.map(a => ({ 
            ...a, 
            completed: false, 
            completedAt: undefined,
            progress: a.maxProgress ? 0 : undefined
          })),
          popupShown: false,
          lastPopupDate: null,
        });
      },

      markPopupShown: () => {
        set({ popupShown: true });
      },

      shouldShowPopup: () => {
        const { achievements, popupShown } = get();
        const hasIncompleteAchievements = achievements.some(a => !a.completed);
        return !popupShown && hasIncompleteAchievements;
      },

      shouldShow3AMPopup: () => {
        const { lastPopupDate } = get();
        const now = new Date();
        const currentHour = now.getHours();
        const today = now.toISOString();
        
        // Check if it's 3 AM and we haven't shown the popup today
        if (currentHour === 3) {
          if (!lastPopupDate || !isSameDay(lastPopupDate, today)) {
            return true;
          }
        }
        
        return false;
      },

      mark3AMPopupShown: () => {
        set({ lastPopupDate: new Date().toISOString() });
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);