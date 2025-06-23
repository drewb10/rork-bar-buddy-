import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
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
    order: 6,
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
    order: 7,
  },
  {
    id: 'karaoke-star',
    title: 'Karaoke Star',
    description: 'Sang karaoke at a venue',
    category: 'activities',
    completed: false,
    icon: '🎤',
    order: 8,
  },
  {
    id: 'trivia-master',
    title: 'Trivia Master',
    description: 'Participated in trivia night',
    category: 'activities',
    completed: false,
    icon: '🧠',
    order: 9,
  },
  {
    id: 'pool-shark',
    title: 'Pool Shark',
    description: 'Played pool or billiards',
    category: 'activities',
    completed: false,
    icon: '🎱',
    order: 10,
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
    order: 11,
  },
  {
    id: 'conversation-starter',
    title: 'Conversation Starter',
    description: 'Started a chat in a venue',
    category: 'social',
    completed: false,
    icon: '💬',
    order: 12,
  },
  {
    id: 'group-leader',
    title: 'Group Leader',
    description: 'Went out with 5+ friends',
    category: 'social',
    completed: false,
    icon: '👥',
    order: 13,
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