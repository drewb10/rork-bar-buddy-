import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';

interface Friend {
  userId: string;
  name: string;
  profilePicture?: string;
  nightsOut: number;
  barsHit: number;
  rankTitle: string;
  addedAt: string;
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
}

interface UserProfileState {
  profile: UserProfile;
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
  resetProfile: () => void;
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
};

const getRankInfo = (averageScore: number): { rank: number; title: string; color: string } => {
  if (averageScore >= 8.5) return { rank: 4, title: 'Blackout Boss', color: '#9C27B0' };
  if (averageScore >= 5.51) return { rank: 3, title: 'Buzzed Beginner', color: '#FF9800' };
  if (averageScore >= 3.01) return { rank: 2, title: 'Tipsy Talent', color: '#FFC107' };
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
      
      updateProfile: (updates) => 
        set((state) => ({
          profile: { 
            ...state.profile, 
            ...updates,
            hasCustomizedProfile: true
          }
        })),
      
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
          }
        } catch (error) {
          console.warn('Error incrementing nights out:', error);
        }
      },
      
      incrementBarsHit: () =>
        set((state) => ({
          profile: {
            ...state.profile,
            barsHit: state.profile.barsHit + 1
          }
        })),
      
      addDrunkScaleRating: (rating) => {
        try {
          const today = new Date().toISOString();
          
          trpcClient.analytics.trackDrunkScale.mutate({
            rating,
            timestamp: today,
            sessionId: Math.random().toString(36).substr(2, 9),
          }).catch(error => {
            console.warn('Failed to track drunk scale rating in cloud:', error);
          });
          
          set((state) => ({
            profile: {
              ...state.profile,
              drunkScaleRatings: [...state.profile.drunkScaleRatings, rating],
              lastDrunkScaleDate: today
            }
          }));
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
      },

      generateUserId: (firstName: string, lastName: string) => {
        const cleanName = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, '');
        const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
        return `#${cleanName}${randomDigits}`;
      },

      completeOnboarding: (firstName: string, lastName: string) => {
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

        // Sync to cloud
        trpcClient.user.createProfile.mutate({
          userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          profilePicture: get().profile.profilePicture,
        }).catch(error => {
          console.warn('Failed to sync profile to cloud:', error);
        });
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

          // Sync to cloud
          trpcClient.user.addFriend.mutate({
            userId: profile.userId!,
            friendUserId,
          }).catch(error => {
            console.warn('Failed to sync friend to cloud:', error);
          });

          return true;
        } catch {
          return false;
        }
      },

      removeFriend: (friendUserId: string) => {
        set((state) => ({
          profile: {
            ...state.profile,
            friends: state.profile.friends.filter(f => f.userId !== friendUserId)
          }
        }));
      },

      searchUser: async (userId: string) => {
        try {
          const result = await trpcClient.user.searchUser.query({ userId });
          if (result.success && result.user) {
            return {
              userId: result.user.userId,
              name: `${result.user.firstName} ${result.user.lastName}`,
              profilePicture: result.user.profilePicture,
              nightsOut: result.user.nightsOut,
              barsHit: result.user.barsHit,
              rankTitle: result.user.rankTitle,
              addedAt: new Date().toISOString(),
            };
          }
          return null;
        } catch {
          return null;
        }
      },

      resetProfile: () => {
        const { profile } = get();
        if (!profile.hasCustomizedProfile) {
          set({ profile: defaultProfile });
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