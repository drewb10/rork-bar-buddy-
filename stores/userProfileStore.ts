import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  joinDate: string;
  nightsOut: number;
  barsHit: number;
  drunkScaleRatings: number[];
  lastNightOutDate?: string; // Track last date to prevent multiple increments per day
}

interface UserProfileState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  incrementNightsOut: () => void;
  incrementBarsHit: () => void;
  addDrunkScaleRating: (rating: number) => void;
  getAverageDrunkScale: () => number;
  getRank: () => { rank: number; title: string };
  canIncrementNightsOut: () => boolean;
}

const defaultProfile: UserProfile = {
  firstName: 'Bar',
  lastName: 'Buddy',
  email: 'user@barbuddy.com',
  joinDate: new Date().toISOString(),
  nightsOut: 0,
  barsHit: 0,
  drunkScaleRatings: [],
};

const getRankInfo = (averageScore: number): { rank: number; title: string } => {
  if (averageScore >= 8.5) return { rank: 10, title: 'Legendary Partier' };
  if (averageScore >= 7.5) return { rank: 9, title: 'Party Animal' };
  if (averageScore >= 6.5) return { rank: 8, title: 'Night Owl' };
  if (averageScore >= 5.5) return { rank: 7, title: 'Social Butterfly' };
  if (averageScore >= 4.5) return { rank: 6, title: 'Weekend Warrior' };
  if (averageScore >= 3.5) return { rank: 5, title: 'Casual Drinker' };
  if (averageScore >= 2.5) return { rank: 4, title: 'Light Sipper' };
  if (averageScore >= 1.5) return { rank: 3, title: 'Designated Driver' };
  if (averageScore >= 0.5) return { rank: 2, title: 'Teetotaler' };
  return { rank: 1, title: 'Newbie' };
};

const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      
      updateProfile: (updates) => 
        set((state) => ({
          profile: { ...state.profile, ...updates }
        })),
      
      incrementNightsOut: () => {
        const today = new Date().toISOString();
        const { profile } = get();
        
        if (!profile.lastNightOutDate || !isSameDay(profile.lastNightOutDate, today)) {
          set((state) => ({
            profile: {
              ...state.profile,
              nightsOut: state.profile.nightsOut + 1,
              lastNightOutDate: today
            }
          }));
        }
      },
      
      incrementBarsHit: () =>
        set((state) => ({
          profile: {
            ...state.profile,
            barsHit: state.profile.barsHit + 1
          }
        })),
      
      addDrunkScaleRating: (rating) =>
        set((state) => ({
          profile: {
            ...state.profile,
            drunkScaleRatings: [...state.profile.drunkScaleRatings, rating]
          }
        })),
      
      getAverageDrunkScale: () => {
        const { drunkScaleRatings } = get().profile;
        if (drunkScaleRatings.length === 0) return 0;
        const sum = drunkScaleRatings.reduce((acc, rating) => acc + rating, 0);
        return Math.round((sum / drunkScaleRatings.length) * 10) / 10;
      },
      
      getRank: () => {
        const averageScore = get().getAverageDrunkScale();
        return getRankInfo(averageScore);
      },
      
      canIncrementNightsOut: () => {
        const today = new Date().toISOString();
        const { profile } = get();
        return !profile.lastNightOutDate || !isSameDay(profile.lastNightOutDate, today);
      }
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);