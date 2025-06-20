import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Friend {
  userId: string;
  name: string;
  profilePicture?: string;
  nightsOut: number;
  barsHit: number;
  rankTitle: string;
  addedAt: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserProfilePicture?: string;
  fromUserRank: string;
  sentAt: string;
}

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
  friends: Friend[];
  friendRequests: FriendRequest[];
}

interface UserProfileState {
  profile: UserProfile;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  incrementNightsOut: () => void;
  incrementBarsHit: () => void;
  addDrunkScaleRating: (rating: number) => void;
  getAverageDrunkScale: () => number;
  getRank: () => { rank: number; title: string; color: string };
  canIncrementNightsOut: () => boolean;
  canSubmitDrunkScale: () => boolean;
  setProfilePicture: (uri: string) => void;
  setUserName: (firstName: string, lastName: string) => void;
  generateUserId: (firstName: string, lastName: string) => string;
  completeOnboarding: (firstName: string, lastName: string) => void;
  addFriend: (friendUserId: string) => Promise<boolean>;
  removeFriend: (friendUserId: string) => void;
  searchUser: (userId: string) => Promise<Friend | null>;
  sendFriendRequest: (friendUserId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  declineFriendRequest: (requestId: string) => Promise<boolean>;
  loadFriendRequests: () => Promise<void>;
  resetProfile: () => void;
  resetStats: () => void;
  syncToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
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
  friends: [],
  friendRequests: [],
};

const getRankInfo = (averageScore: number): { rank: number; title: string; color: string } => {
  if (averageScore >= 8.1) return { rank: 5, title: 'Scoop & Score Champ', color: '#9C27B0' };
  if (averageScore >= 6.1) return { rank: 4, title: 'Big Chocolate', color: '#FF5722' };
  if (averageScore >= 4.1) return { rank: 3, title: 'Tipsy Talent', color: '#FF9800' };
  if (averageScore >= 2.1) return { rank: 2, title: 'Buzzed Beginner', color: '#FFC107' };
  return { rank: 1, title: 'Sober Star', color: '#4CAF50' };
};

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

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      isLoading: false,
      
      updateProfile: (updates) => {
        set((state) => ({
          profile: { 
            ...state.profile, 
            ...updates,
            hasCustomizedProfile: true
          }
        }));
        get().syncToSupabase();
      },
      
      incrementNightsOut: () => {
        try {
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
            get().syncToSupabase();
          }
        } catch (error) {
          console.warn('Error incrementing nights out:', error);
        }
      },
      
      incrementBarsHit: () => {
        set((state) => ({
          profile: {
            ...state.profile,
            barsHit: state.profile.barsHit + 1
          }
        }));
        get().syncToSupabase();
      },
      
      addDrunkScaleRating: (rating) => {
        try {
          const today = new Date().toISOString();
          
          set((state) => ({
            profile: {
              ...state.profile,
              drunkScaleRatings: [...state.profile.drunkScaleRatings, rating],
              lastDrunkScaleDate: today
            }
          }));
          get().syncToSupabase();
        } catch (error) {
          console.warn('Error adding drunk scale rating:', error);
        }
      },
      
      getAverageDrunkScale: () => {
        try {
          const { drunkScaleRatings } = get().profile;
          if (drunkScaleRatings.length === 0) return 0;
          const sum = drunkScaleRatings.reduce((acc, rating) => acc + rating, 0);
          return Math.round((sum / drunkScaleRatings.length) * 10) / 10;
        } catch {
          return 0;
        }
      },
      
      getRank: () => {
        try {
          const averageScore = get().getAverageDrunkScale();
          return getRankInfo(averageScore);
        } catch {
          return { rank: 1, title: 'Sober Star', color: '#4CAF50' };
        }
      },
      
      canIncrementNightsOut: () => {
        try {
          const today = new Date().toISOString();
          const { profile } = get();
          return !profile.lastNightOutDate || !isSameDay(profile.lastNightOutDate, today);
        } catch {
          return true;
        }
      },

      canSubmitDrunkScale: () => {
        try {
          const today = new Date().toISOString();
          const { profile } = get();
          return !profile.lastDrunkScaleDate || !isSameDay(profile.lastDrunkScaleDate, today);
        } catch {
          return true;
        }
      },

      setProfilePicture: (uri: string) => {
        set((state) => ({
          profile: {
            ...state.profile,
            profilePicture: uri,
            hasCustomizedProfile: true
          }
        }));
        get().syncToSupabase();
      },

      setUserName: (firstName: string, lastName: string) => {
        set((state) => ({
          profile: {
            ...state.profile,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            hasCustomizedProfile: true
          }
        }));
        get().syncToSupabase();
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

        await get().syncToSupabase();
      },

      addFriend: async (friendUserId: string) => {
        try {
          const friend = await get().searchUser(friendUserId);
          if (!friend) return false;

          const { profile } = get();
          if (profile.friends.some(f => f.userId === friendUserId)) {
            return false; // Already friends
          }

          set((state) => ({
            profile: {
              ...state.profile,
              friends: [...state.profile.friends, friend]
            }
          }));

          return true;
        } catch {
          return false;
        }
      },

      removeFriend: async (friendUserId: string) => {
        set((state) => ({
          profile: {
            ...state.profile,
            friends: state.profile.friends.filter(f => f.userId !== friendUserId)
          }
        }));
      },

      searchUser: async (userId: string) => {
        try {
          // Mock implementation - in real app this would query Supabase
          // For now, return a mock user for testing
          if (userId.startsWith('#')) {
            return {
              userId,
              name: 'Test User',
              nightsOut: Math.floor(Math.random() * 20),
              barsHit: Math.floor(Math.random() * 50),
              rankTitle: 'Tipsy Talent',
              addedAt: new Date().toISOString(),
            };
          }
          return null;
        } catch {
          return null;
        }
      },

      sendFriendRequest: async (friendUserId: string) => {
        try {
          // Mock implementation - in real app this would use Supabase
          return true;
        } catch {
          return false;
        }
      },

      acceptFriendRequest: async (requestId: string) => {
        try {
          // Mock implementation - in real app this would use Supabase
          return true;
        } catch {
          return false;
        }
      },

      declineFriendRequest: async (requestId: string) => {
        try {
          // Mock implementation - in real app this would use Supabase
          return true;
        } catch {
          return false;
        }
      },

      loadFriendRequests: async () => {
        try {
          // Mock implementation - in real app this would query Supabase
        } catch (error) {
          console.warn('Error loading friend requests:', error);
        }
      },

      resetProfile: () => {
        const { profile } = get();
        if (!profile.hasCustomizedProfile) {
          set({ profile: defaultProfile });
        }
      },

      resetStats: async () => {
        try {
          set((state) => ({
            profile: {
              ...state.profile,
              nightsOut: 0,
              barsHit: 0,
              drunkScaleRatings: [],
              lastNightOutDate: undefined,
              lastDrunkScaleDate: undefined,
            }
          }));
          await get().syncToSupabase();
        } catch (error) {
          console.warn('Error resetting stats:', error);
        }
      },

      syncToSupabase: async () => {
        try {
          // Mock implementation - in real app this would sync to Supabase
        } catch (error) {
          console.warn('Error syncing to Supabase:', error);
        }
      },

      loadFromSupabase: async () => {
        try {
          // Mock implementation - in real app this would load from Supabase
        } catch (error) {
          console.warn('Error loading from Supabase:', error);
        }
      }
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__userProfileStore = useUserProfileStore;
}