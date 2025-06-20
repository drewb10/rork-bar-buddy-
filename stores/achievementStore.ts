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
}

interface AchievementState {
  achievements: Achievement[];
  lastPopupDate?: string;
  canShowPopup: () => boolean;
  initializeAchievements: () => void;
  completeAchievement: (id: string) => void;
  markPopupShown: () => void;
  getCompletedCount: () => number;
  getAchievementsByCategory: (category: Achievement['category']) => Achievement[];
  resetAchievements: () => void;
  updateAchievementProgress: (id: string, progress: number) => void;
}

const defaultAchievements: Achievement[] = [
  // Bar hopping achievements (ordered by difficulty)
  {
    id: 'three-bars-night',
    title: 'Triple Threat',
    description: 'Went to 3 bars tonight',
    detailedDescription: 'Visit 3 different bars in one night. Use the flame button to check in at each location!',
    category: 'bars',
    completed: false,
    icon: '🍻',
    progress: 0,
    maxProgress: 3,
    order: 1,
  },
  {
    id: 'five-bars-night',
    title: 'Bar Crawler',
    description: 'Visited 5 bars in one night',
    detailedDescription: 'The ultimate bar crawl! Visit 5 different bars in a single night. Pace yourself and stay safe!',
    category: 'bars',
    completed: false,
    icon: '🚶‍♂️',
    progress: 0,
    maxProgress: 5,
    order: 2,
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Went out both Friday and Saturday',
    detailedDescription: 'Show your dedication by going out on both Friday and Saturday night in the same weekend.',
    category: 'bars',
    completed: false,
    icon: '⚔️',
    progress: 0,
    maxProgress: 2,
    order: 3,
  },
  
  // Activity achievements (ordered by venue/activity)
  {
    id: 'jba-pool',
    title: 'Pool Shark at JBA',
    description: 'Played pool at JBA',
    detailedDescription: 'Show off your pool skills at JBA! Sink some balls and have a great time.',
    category: 'activities',
    completed: false,
    icon: '🎱',
    order: 1,
  },
  {
    id: 'bird-dart',
    title: 'Dart Master at The Bird',
    description: 'Smoked a dart at The Bird',
    detailedDescription: 'Hit the bullseye (or at least try to) at The Bird. Perfect your aim and enjoy the competition!',
    category: 'activities',
    completed: false,
    icon: '🎯',
    order: 2,
  },
  {
    id: 'late-night-shots',
    title: 'Late Night Shots',
    description: 'Took shots at Late Night',
    detailedDescription: 'Celebrate the night with shots at Late Night! Remember to drink responsibly.',
    category: 'activities',
    completed: false,
    icon: '🥃',
    order: 3,
  },
  {
    id: 'karaoke-star',
    title: 'Karaoke Star',
    description: 'Sang karaoke like a pro',
    detailedDescription: 'Take the stage and belt out your favorite song! Whether you can sing or not, have fun with it.',
    category: 'activities',
    completed: false,
    icon: '🎤',
    order: 4,
  },
  {
    id: 'dance-floor-king',
    title: 'Dance Floor Royalty',
    description: 'Owned the dance floor',
    detailedDescription: 'Show off your moves and own the dance floor! Let loose and dance like nobody is watching.',
    category: 'activities',
    completed: false,
    icon: '💃',
    order: 5,
  },
  
  // Social achievements (ordered by interaction level)
  {
    id: 'made-new-friend',
    title: 'Social Butterfly',
    description: 'Made a new friend at the bar',
    detailedDescription: 'Strike up a conversation and make a new friend! The best nights often start with meeting new people.',
    category: 'social',
    completed: false,
    icon: '🤝',
    order: 1,
  },
  
  // Milestone achievements (ordered by significance)
  {
    id: 'first-night-out',
    title: 'First Night Out',
    description: 'Completed your first night out',
    detailedDescription: 'Welcome to BarBuddy! This marks the beginning of your nightlife journey. Many more adventures await!',
    category: 'milestones',
    completed: false,
    icon: '🌟',
    order: 1,
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
      lastPopupDate: undefined,

      canShowPopup: () => {
        const { lastPopupDate } = get();
        const today = new Date().toISOString();
        
        // Check if it's 3 AM
        if (!isThreeAM()) return false;
        
        // Check if popup was already shown today
        if (lastPopupDate && isSameDay(lastPopupDate, today)) {
          return false;
        }
        
        return true;
      },

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
                  completed: achievement.maxProgress ? progress >= achievement.maxProgress : achievement.completed
                }
              : achievement
          )
        }));
      },

      markPopupShown: () => {
        set({ lastPopupDate: new Date().toISOString() });
      },

      getCompletedCount: () => {
        const { achievements } = get();
        return achievements.filter(a => a.completed).length;
      },

      getAchievementsByCategory: (category: Achievement['category']) => {
        const { achievements } = get();
        return achievements
          .filter(a => a.category === category)
          .sort((a, b) => a.order - b.order);
      },

      resetAchievements: () => {
        set({
          achievements: defaultAchievements.map(a => ({ 
            ...a, 
            completed: false, 
            completedAt: undefined,
            progress: a.maxProgress ? 0 : undefined
          })),
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