import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

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
  resetProfile: () => void;
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

          // Add to Supabase
          const { error } = await supabase
            .from('friends')
            .insert({
              user_id: profile.userId!,
              friend_user_id: friendUserId,
            });

          if (error) {
            console.warn('Failed to add friend to Supabase:', error);
            return false;
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
        const { profile } = get();
        
        // Remove from Supabase
        await supabase
          .from('friends')
          .delete()
          .eq('user_id', profile.userId!)
          .eq('friend_user_id', friendUserId);

        set((state) => ({
          profile: {
            ...state.profile,
            friends: state.profile.friends.filter(f => f.userId !== friendUserId)
          }
        }));
      },

      searchUser: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error || !data) {
            return null;
          }

          return {
            userId: data.user_id,
            name: `${data.first_name} ${data.last_name}`,
            profilePicture: data.profile_pic || undefined,
            nightsOut: data.total_nights_out,
            barsHit: data.total_bars_hit,
            rankTitle: data.ranking,
            addedAt: new Date().toISOString(),
          };
        } catch {
          return null;
        }
      },

      resetProfile: () => {
        const { profile } = get();
        if (!profile.hasCustomizedProfile) {
          set({ profile: defaultProfile });
        }
      },

      syncToSupabase: async () => {
        try {
          const { profile } = get();
          if (!profile.userId || profile.userId === 'default') return;

          const rankInfo = get().getRank();
          
          const { error } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: profile.userId,
              username: `${profile.firstName}${profile.lastName}`,
              first_name: profile.firstName,
              last_name: profile.lastName,
              email: profile.email,
              profile_pic: profile.profilePicture,
              total_nights_out: profile.nightsOut,
              total_bars_hit: profile.barsHit,
              drunk_scale_ratings: profile.drunkScaleRatings,
              last_night_out_date: profile.lastNightOutDate,
              last_drunk_scale_date: profile.lastDrunkScaleDate,
              has_completed_onboarding: profile.hasCompletedOnboarding,
              ranking: rankInfo.title,
              join_date: profile.joinDate,
            });

          if (error) {
            console.warn('Failed to sync profile to Supabase:', error);
          }
        } catch (error) {
          console.warn('Error syncing to Supabase:', error);
        }
      },

      loadFromSupabase: async () => {
        try {
          set({ isLoading: true });
          const { profile } = get();
          if (!profile.userId || profile.userId === 'default') {
            set({ isLoading: false });
            return;
          }

          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', profile.userId)
            .single();

          if (error || !data) {
            set({ isLoading: false });
            return;
          }

          // Load friends with proper join query
          const { data: friendsData } = await supabase
            .from('friends')
            .select(`
              friend_user_id,
              user_profiles!friends_friend_user_id_fkey (
                user_id,
                first_name,
                last_name,
                profile_pic,
                total_nights_out,
                total_bars_hit,
                ranking
              )
            `)
            .eq('user_id', profile.userId);

          const friends: Friend[] = friendsData?.map(f => {
            // Handle the case where user_profiles might be an array or object
            const userProfile = Array.isArray(f.user_profiles) ? f.user_profiles[0] : f.user_profiles;
            
            if (!userProfile) return null;
            
            return {
              userId: userProfile.user_id,
              name: `${userProfile.first_name} ${userProfile.last_name}`,
              profilePicture: userProfile.profile_pic || undefined,
              nightsOut: userProfile.total_nights_out,
              barsHit: userProfile.total_bars_hit,
              rankTitle: userProfile.ranking,
              addedAt: new Date().toISOString(),
            };
          }).filter(Boolean) || [];

          set({
            profile: {
              ...profile,
              firstName: data.first_name,
              lastName: data.last_name,
              email: data.email || profile.email,
              profilePicture: data.profile_pic || undefined,
              nightsOut: data.total_nights_out,
              barsHit: data.total_bars_hit,
              drunkScaleRatings: data.drunk_scale_ratings || [],
              lastNightOutDate: data.last_night_out_date || undefined,
              lastDrunkScaleDate: data.last_drunk_scale_date || undefined,
              hasCompletedOnboarding: data.has_completed_onboarding,
              joinDate: data.join_date,
              friends,
            },
            isLoading: false
          });
        } catch (error) {
          console.warn('Error loading from Supabase:', error);
          set({ isLoading: false });
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