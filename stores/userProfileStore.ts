import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, XPActivity } from '@/types';

// ✅ FIX 1: Add missing XP_VALUES constant
const XP_VALUES = {
  visit_new_bar: 15,
  participate_event: 50,
  bring_friend: 30,
  complete_night_out: 20,
  special_achievement: 75,
  live_music: 40,
  featured_drink: 20,
  bar_game: 35,
  photo_taken: 10,
  shots: 5,
  scoop_and_scores: 10,
  beers: 5,
  beer_towers: 15,
  funnels: 10,
  shotguns: 10,
  pool_games: 15,
  dart_games: 15,
  drunk_scale_submission: 25,
  like_bar: 5,
  check_in: 10,
  new_member_bonus: 100,
} as const;

type XPType = keyof typeof XP_VALUES;

interface UserProfileStore {
  profile: UserProfile | null;
  isLoading: boolean;
  friends: UserProfile[];
  isInitialized: boolean;
  
  // Profile management
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => void;
  initializeProfile: (userId: string) => Promise<void>;
  
  // XP and stats
  awardXP: (type: XPType, description: string, venueId?: string) => Promise<void>;
  incrementNightsOut: () => Promise<void>;
  incrementBarsHit: () => Promise<void>;
  incrementPhotosTaken: () => Promise<void>;
  addDrunkScaleRating: (rating: number) => Promise<void>;
  getAverageDrunkScale: () => number;
  canIncrementNightsOut: () => boolean;
  
  // Stats syncing
  syncStatsFromDailyStats: () => Promise<void>;
  
  // Profile picture
  setProfilePicture: (uri: string) => Promise<void>;
  
  // Friends
  loadFriends: () => Promise<void>;
}

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      friends: [],
      isInitialized: false,

      setProfile: (profile) => {
        set({ profile, isInitialized: true });
      },

      clearProfile: () => {
        set({ profile: null, friends: [], isInitialized: false });
      },

      // ✅ FIX 2: Add profile initialization function with proper typing
      initializeProfile: async (userId: string) => {
        if (!isSupabaseConfigured() || !userId) {
          console.log('🔧 UserProfile: Creating demo profile for user:', userId);
          // Create a demo profile for non-Supabase usage
          const demoProfile: UserProfile = {
            id: userId,
            username: 'demo_user',
            email: 'demo@example.com',
            xp: 0,
            nights_out: 0,
            bars_hit: 0,
            total_shots: 0,
            total_beers: 0,
            total_beer_towers: 0,
            total_funnels: 0,
            total_shotguns: 0,
            pool_games_won: 0,
            dart_games_won: 0,
            photos_taken: 0,
            drunk_scale_ratings: [],
            visited_bars: [],
            xp_activities: [],
            has_completed_onboarding: false,
            profile_picture: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ profile: demoProfile, isInitialized: true });
          return;
        }

        set({ isLoading: true });

        try {
          console.log('🔧 UserProfile: Loading profile for user:', userId);
          
          if (!supabase) {
            throw new Error('Supabase client not available');
          }

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              // Profile doesn't exist, create one
              console.log('🔧 UserProfile: Creating new profile for user:', userId);
              
              const { data: user } = await supabase.auth.getUser();
              const userEmail = user?.user?.email || '';
              
              const newProfile = {
                id: userId,
                username: `user_${userId.slice(0, 8)}`,
                email: userEmail,
                xp: 0,
                nights_out: 0,
                bars_hit: 0,
                total_shots: 0,
                total_beers: 0,
                total_beer_towers: 0,
                total_funnels: 0,
                total_shotguns: 0,
                pool_games_won: 0,
                dart_games_won: 0,
                photos_taken: 0,
                drunk_scale_ratings: [],
                visited_bars: [],
                xp_activities: [],
                has_completed_onboarding: false,
                profile_picture: undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

              if (createError) {
                throw createError;
              }

              set({ profile: createdProfile as UserProfile, isInitialized: true });
              console.log('✅ UserProfile: New profile created successfully');
            } else {
              throw error;
            }
          } else {
            set({ profile: profile as UserProfile, isInitialized: true });
            console.log('✅ UserProfile: Profile loaded successfully');
          }
        } catch (error) {
          console.error('❌ UserProfile: Error initializing profile:', error);
          set({ isInitialized: true }); // Set as initialized even if failed to prevent infinite loading
        } finally {
          set({ isLoading: false });
        }
      },

      setProfilePicture: async (uri: string) => {
        const { profile } = get();
        if (!profile) {
          console.warn('❌ No profile available for profile picture update');
          return;
        }

        await get().updateProfile({ profile_picture: uri });
      },

      canIncrementNightsOut: () => {
        const { profile } = get();
        if (!profile) return false;

        const today = new Date().toISOString().split('T')[0];
        const lastNightOut = profile.last_night_out_date;
        
        if (!lastNightOut) return true;
        
        const lastNightOutDate = new Date(lastNightOut).toISOString().split('T')[0];
        return today !== lastNightOutDate;
      },

      incrementNightsOut: async () => {
        const { profile } = get();
        if (!profile || !get().canIncrementNightsOut()) return;

        const newNightsOut = (profile.nights_out || 0) + 1;
        const today = new Date().toISOString();
        
        await get().updateProfile({
          nights_out: newNightsOut,
          last_night_out_date: today
        });
        
        // Award XP for night out
        await get().awardXP('complete_night_out', 'Completed a night out');
      },

      incrementBarsHit: async () => {
        const { profile } = get();
        if (!profile) return;

        const newBarsHit = (profile.bars_hit || 0) + 1;
        
        await get().updateProfile({
          bars_hit: newBarsHit
        });
        
        // Award XP for bar visit
        await get().awardXP('visit_new_bar', 'Visited a new bar');
      },

      incrementPhotosTaken: async () => {
        const { profile } = get();
        if (!profile) return;

        const newPhotosTaken = (profile.photos_taken || 0) + 1;
        
        await get().updateProfile({
          photos_taken: newPhotosTaken
        });
        
        // Award XP for photo taken
        await get().awardXP('photo_taken', 'Took a photo');
      },
      
      addDrunkScaleRating: async (rating: number) => {
        const { profile } = get();
        if (!profile) {
          console.error('❌ No profile available for drunk scale rating');
          return;
        }

        const today = new Date().toISOString();
        const currentRatings = profile.drunk_scale_ratings || [];
        
        await get().updateProfile({
          drunk_scale_ratings: [...currentRatings, rating],
          last_drunk_scale_date: today
        });
        
        // Award XP for drunk scale submission
        await get().awardXP('drunk_scale_submission', `Submitted drunk scale rating: ${rating}/10`);
      },
      
      getAverageDrunkScale: () => {
        const { profile } = get();
        if (!profile || !profile.drunk_scale_ratings || profile.drunk_scale_ratings.length === 0) return 0;
        
        const sum = profile.drunk_scale_ratings.reduce((acc, rating) => acc + rating, 0);
        return Math.round((sum / profile.drunk_scale_ratings.length) * 10) / 10;
      },
      
      // ✅ FIX 3: Enhanced awardXP function with proper error handling
      awardXP: async (type: XPType, description: string, venueId?: string) => {
        const { profile } = get();

        if (!profile) {
          console.warn('❌ No profile available for XP award. Please ensure profile is initialized first.');
          return;
        }

        const xpAmount = XP_VALUES[type];
        if (!xpAmount) {
          console.warn('Invalid XP type:', type);
          return;
        }

        console.log(`🎯 Awarding ${xpAmount} XP for ${type}: ${description}`);
        
        const activityId = Math.random().toString(36).substr(2, 9);
        
        const newActivity: XPActivity = {
          id: activityId,
          type,
          xpAwarded: xpAmount,
          timestamp: new Date().toISOString(),
          description,
        };
        
        const currentXPActivities = profile.xp_activities || [];
        
        let updates: Partial<UserProfile> = {
          xp: (profile.xp || 0) + xpAmount,
          xp_activities: [...currentXPActivities, newActivity],
        };
        
        // Handle specific XP type updates
        switch (type) {
          case 'visit_new_bar':
            if (venueId && !profile.visited_bars?.includes(venueId)) {
              updates.visited_bars = [...(profile.visited_bars || []), venueId];
              updates.bars_hit = (profile.bars_hit || 0) + 1;
            }
            break;
          case 'photo_taken':
            updates.photos_taken = (profile.photos_taken || 0) + 1;
            break;
          case 'pool_games':
            updates.pool_games_won = (profile.pool_games_won || 0) + 1;
            break;
          case 'dart_games':
            updates.dart_games_won = (profile.dart_games_won || 0) + 1;
            break;
        }
        
        await get().updateProfile(updates);
        
        // ✅ FIX 4: Trigger achievement checking after XP award
        setTimeout(() => {
          if (typeof window !== 'undefined' && (window as any).__achievementStore) {
            const achievementStore = (window as any).__achievementStore;
            if (achievementStore?.getState) {
              const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
              const currentProfile = get().profile;
              if (currentProfile && checkAndUpdateMultiLevelAchievements) {
                checkAndUpdateMultiLevelAchievements({
                  totalBeers: currentProfile.total_beers || 0,
                  totalShots: currentProfile.total_shots || 0,
                  totalBeerTowers: currentProfile.total_beer_towers || 0,
                  totalScoopAndScores: currentProfile.total_scoop_and_scores || 0,
                  totalFunnels: currentProfile.total_funnels || 0,
                  totalShotguns: currentProfile.total_shotguns || 0,
                  poolGamesWon: currentProfile.pool_games_won || 0,
                  dartGamesWon: currentProfile.dart_games_won || 0,
                  barsHit: currentProfile.bars_hit || 0,
                  nightsOut: currentProfile.nights_out || 0,
                });
              }
            }
          }
        }, 100);
        
        console.log(`✅ XP awarded successfully. New total: ${(profile.xp || 0) + xpAmount}`);
      },

      // ✅ FIX 5: Enhanced stats syncing from daily_stats table
      syncStatsFromDailyStats: async () => {
        const { profile } = get();
        if (!profile || !isSupabaseConfigured()) {
          console.warn('❌ Cannot sync stats: No profile or Supabase not configured');
          return;
        }

        try {
          console.log('🔄 Syncing stats from daily_stats table...');
          
          if (!supabase) {
            console.warn('Supabase client not available for stats sync');
            return;
          }

          // Get all daily stats for the user
          const { data: dailyStats, error } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', profile.id);

          if (error) {
            console.error('Error syncing stats from daily_stats:', error);
            return;
          }

          if (!dailyStats || dailyStats.length === 0) return;

          // Calculate totals from all daily stats
          const totals = dailyStats.reduce((acc, day) => ({
            total_beers: acc.total_beers + (day.beers || 0),
            total_shots: acc.total_shots + (day.shots || 0),
            total_beer_towers: acc.total_beer_towers + (day.beer_towers || 0),
            total_funnels: acc.total_funnels + (day.funnels || 0),
            total_shotguns: acc.total_shotguns + (day.shotguns || 0),
            pool_games_won: acc.pool_games_won + (day.pool_games_won || 0),
            dart_games_won: acc.dart_games_won + (day.dart_games_won || 0),
            nights_out: acc.nights_out + 1, // Each day with stats counts as a night out
          }), {
            total_beers: 0,
            total_shots: 0,
            total_beer_towers: 0,
            total_funnels: 0,
            total_shotguns: 0,
            pool_games_won: 0,
            dart_games_won: 0,
            nights_out: 0,
          });

          // Update profile with synced stats
          await get().updateProfile(totals);

          console.log('✅ Stats synced from daily_stats table');
        } catch (error) {
          console.warn('Error syncing stats from daily_stats:', error);
        }
      },

      // ✅ FIX 6: Enhanced updateProfile with proper typing
      updateProfile: async (updates: Partial<UserProfile>) => {
        const state = get();
        if (!state.profile) {
          console.error('❌ No profile available for update');
          return;
        }

        try {
          console.log('🔄 Updating profile with:', updates);
          
          // ✅ FIX 7: Proper type-safe state update
          set({
            profile: { ...state.profile, ...updates }
          });

          // Try to update in Supabase if available
          if (isSupabaseConfigured() && supabase) {
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
              try {
                const { error } = await supabase
                  .from('profiles')
                  .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', state.profile.id);

                if (error) {
                  throw error;
                }

                console.log('✅ Profile updated in Supabase successfully');
                break;
                
              } catch (supabaseError) {
                retryCount++;
                console.warn(`Attempt ${retryCount} failed:`, supabaseError);
                
                if (retryCount === maxRetries) {
                  console.warn('Failed to update profile in Supabase after retries, keeping local changes');
                } else {
                  // Wait before retry
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
              }
            }
          }

          // ✅ FIX 8: Trigger achievement checking after profile updates
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).__achievementStore) {
              const achievementStore = (window as any).__achievementStore;
              if (achievementStore?.getState) {
                const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
                const currentProfile = get().profile;
                if (currentProfile && checkAndUpdateMultiLevelAchievements) {
                  checkAndUpdateMultiLevelAchievements({
                    totalBeers: currentProfile.total_beers || 0,
                    totalShots: currentProfile.total_shots || 0,
                    totalBeerTowers: currentProfile.total_beer_towers || 0,
                    totalScoopAndScores: currentProfile.total_scoop_and_scores || 0,
                    totalFunnels: currentProfile.total_funnels || 0,
                    totalShotguns: currentProfile.total_shotguns || 0,
                    poolGamesWon: currentProfile.pool_games_won || 0,
                    dartGamesWon: currentProfile.dart_games_won || 0,
                    barsHit: currentProfile.bars_hit || 0,
                    nightsOut: currentProfile.nights_out || 0,
                  });
                }
              }
            }
          }, 100);

        } catch (error) {
          console.error('❌ Error updating profile:', error);
          // Revert local changes on critical error
          set({ profile: state.profile });
          throw error;
        }
      },

      loadFriends: async () => {
        const { profile } = get();
        if (!profile || !isSupabaseConfigured()) return;

        try {
          // Implementation for loading friends
          console.log('Loading friends...');
          
          if (!supabase) {
            console.warn('Supabase client not available');
            return;
          }

          const { data: friends, error } = await supabase
            .from('friends')
            .select(`
              friend_id,
              profiles!friends_friend_id_fkey (
                id,
                username,
                profile_picture,
                xp
              )
            `)
            .eq('user_id', profile.id);

          if (error) {
            console.error('Error loading friends:', error);
            return;
          }

          const friendProfiles = friends?.map(f => f.profiles).filter(Boolean) || [];
          
          set((state) => ({
            profile: state.profile ? {
              ...state.profile,
              friends: friendProfiles
            } : null
          }));
        } catch (error) {
          console.error('Error loading friends:', error);
        }
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        profile: state.profile ? {
          id: state.profile.id,
          username: state.profile.username,
          email: state.profile.email,
          xp: state.profile.xp,
          nights_out: state.profile.nights_out,
          bars_hit: state.profile.bars_hit,
          total_shots: state.profile.total_shots,
          total_beers: state.profile.total_beers,
          total_beer_towers: state.profile.total_beer_towers,
          total_funnels: state.profile.total_funnels,
          total_shotguns: state.profile.total_shotguns,
          pool_games_won: state.profile.pool_games_won,
          dart_games_won: state.profile.dart_games_won,
          xp_activities: state.profile.xp_activities,
          visited_bars: state.profile.visited_bars,
          has_completed_onboarding: state.profile.has_completed_onboarding,
          created_at: state.profile.created_at,
          updated_at: state.profile.updated_at,
          drunk_scale_ratings: state.profile.drunk_scale_ratings,
          last_drunk_scale_date: state.profile.last_drunk_scale_date,
          profile_picture: state.profile.profile_picture,
          photos_taken: state.profile.photos_taken,
        } : null,
        isInitialized: state.isInitialized,
      }),
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__userProfileStore = useUserProfileStore;
}