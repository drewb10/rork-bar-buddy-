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
}

const defaultAchievements: Achievement[] = [
  // Bar-specific achievements
  {
    id: 'jba-pool',
    title: 'Pool Shark at JBA',
    description: 'Played pool at JBA',
    category: 'activities',
    completed: false,
    icon: '🎱',
  },
  {
    id: 'late-night-shots',
    title: 'Late Night Shots',
    description: 'Took shots at Late Night',
    category: 'activities',
    completed: false,
    icon: '🥃',
  },
  {
    id: 'bird-dart',
    title: 'Dart Master at The Bird',
    description: 'Smoked a dart at The Bird',
    category: 'activities',
    completed: false,
    icon: '🎯',
  },
  // Bar hopping achievements
  {
    id: 'three-bars-night',
    title: 'Triple Threat',
    description: 'Went to 3 bars tonight',
    category: 'bars',
    completed: false,
    icon: '🍻',
  },
  {
    id: 'five-bars-night',
    title: 'Bar Crawler',
    description: 'Visited 5 bars in one night',
    category: 'bars',
    completed: false,
    icon: '🚶‍♂️',
  },
  // Social achievements
  {
    id: 'made-new-friend',
    title: 'Social Butterfly',
    description: 'Made a new friend at the bar',
    category: 'social',
    completed: false,
    icon: '🤝',
  },
  {
    id: 'karaoke-star',
    title: 'Karaoke Star',
    description: 'Sang karaoke like a pro',
    category: 'activities',
    completed: false,
    icon: '🎤',
  },
  {
    id: 'dance-floor-king',
    title: 'Dance Floor Royalty',
    description: 'Owned the dance floor',
    category: 'activities',
    completed: false,
    icon: '💃',
  },
  // Milestone achievements
  {
    id: 'first-night-out',
    title: 'First Night Out',
    description: 'Completed your first night out',
    category: 'milestones',
    completed: false,
    icon: '🌟',
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Went out both Friday and Saturday',
    category: 'milestones',
    completed: false,
    icon: '⚔️',
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

      markPopupShown: () => {
        set({ lastPopupDate: new Date().toISOString() });
      },

      getCompletedCount: () => {
        const { achievements } = get();
        return achievements.filter(a => a.completed).length;
      },

      getAchievementsByCategory: (category: Achievement['category']) => {
        const { achievements } = get();
        return achievements.filter(a => a.category === category);
      },

      resetAchievements: () => {
        set({
          achievements: defaultAchievements.map(a => ({ ...a, completed: false, completedAt: undefined })),
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