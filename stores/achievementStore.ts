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
}

interface AchievementState {
  achievements: Achievement[];
  initializeAchievements: () => void;
  completeAchievement: (id: string) => void;
  getCompletedCount: () => number;
  resetAchievements: () => void;
  updateAchievementProgress: (id: string, progress: number) => void;
}

const defaultAchievements: Achievement[] = [
  {
    id: 'first-night-out',
    title: 'First Night Out',
    description: 'Completed your first night out',
    category: 'milestones',
    completed: false,
    icon: '🌟',
  },
  {
    id: 'three-bars-night',
    title: 'Triple Threat',
    description: 'Went to 3 bars tonight',
    category: 'bars',
    completed: false,
    icon: '🍻',
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'photo-enthusiast',
    title: 'Photo Enthusiast',
    description: 'Took 10 photos',
    category: 'activities',
    completed: false,
    icon: '📸',
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'photo-master',
    title: 'Photo Master',
    description: 'Took 50 photos',
    category: 'activities',
    completed: false,
    icon: '📷',
    progress: 0,
    maxProgress: 50,
  },
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Added 5 friends',
    category: 'social',
    completed: false,
    icon: '🦋',
    progress: 0,
    maxProgress: 5,
  },
];

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: [],

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
        });
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);