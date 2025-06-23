import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  joinDate: string;
  nightsOut: number;
  barsHit: number;
  drunkScaleRatings: number[];
  lastNightOutDate?: string;
  lastDrunkScaleDate?: string;
  profilePicture?: string;
  userId?: string;
  hasCustomizedProfile?: boolean;
  hasCompletedOnboarding?: boolean;
  xp: number;
  photosTaken: number;
}

interface UserProfileState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: (firstName: string, lastName: string) => Promise<void>;
  generateUserId: (firstName: string, lastName: string) => string;
}

const defaultProfile: UserProfile = {
  firstName: 'Bar',
  lastName: 'Buddy',
  email: 'user@barbuddy.com',
  joinDate: new Date().toISOString(),
  nightsOut: 0,
  barsHit: 0,
  drunkScaleRatings: [],
  userId: 'default',
  hasCustomizedProfile: false,
  hasCompletedOnboarding: false,
  xp: 0,
  photosTaken: 0,
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      
      updateProfile: (updates) => {
        set((state) => ({
          profile: { 
            ...state.profile, 
            ...updates,
            hasCustomizedProfile: true
          }
        }));
      },

      generateUserId: (firstName: string, lastName: string) => {
        const cleanName = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, '');
        const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
        return `#${cleanName}${randomDigits}`;
      },

      completeOnboarding: async (firstName: string, lastName: string) => {
        const userId = get().generateUserId(firstName, lastName);
        
        set((state) => ({
          profile: {
            ...state.profile,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            userId,
            hasCompletedOnboarding: true,
            hasCustomizedProfile: true
          }
        }));
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);