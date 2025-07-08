import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, XPActivity } from '@/types';

// XP VALUES constant
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
  check_in: 10,
  new_member_bonus: 100,
} as const;

type XPType = keyof typeof XP_VALUES;

interface UserProfileStore {
  profile: UserProfile | null;
  isLoading: boolean;
  friends: UserProfile[];
  isInitialized: boolean;
  profileReady: boolean;
  isUpdating: boolean;
  
  // Profile management
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearProfile: () => void;
  initializeProfile: (userId: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  setProfileReady: (ready: boolean) => void;
  
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
      profileReady: false,
      isUpdating: false,

      setProfile: (profile) => {
        set({ profile, isInitialized: true, profileReady: !!profile });
      },

      setProfileReady: (ready: boolean) => {
        set({ profileReady: ready });
      },

      clearProfile: () => {
        set({ profile: null, friends: [], isInitialized: false, profileReady: false });
      },

      // 🔧 SIMPLIFIED: Direct profile loading without complex dependencies
      loadProfile: async () => {
        const state = get();
        
        // Prevent multiple concurrent loads
        if (state.isLoading) {
          console.log('🔄 Profile load already in progress, skipping...');
          return;
        }

        try {
          set({ isLoading: true, profileReady: false });
          console.log('🔄 Starting simplified profile load...');
          
          if (!isSupabaseConfigured()) {
            console.log('🔧 Supabase not configured, using demo profile');
            const demoProfile: UserProfile = {
              id: 'demo-user',
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
            set({ profile: demoProfile, isLoading: false, profileReady: true, isInitialized: true });
            return;
          }

          // Add null check for supabase
          if (!supabase) {
            console.warn('🔄 Supabase client not available');
            set({ isLoading: false, profile: null, profileReady: false });
            return;
          }
          
          // 🔧 CRITICAL: Direct Supabase auth call without complex error handling
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !user) {
            console.log('🔄 No authenticated user found:', authError?.message);
            set({ 
              isLoading: false, 
              profile: null, 
              profileReady: false 
            });
            return;
          }

          console.log('🔄 Found authenticated user:', user.id);

          // 🔧 CRITICAL: Direct profile fetch with minimal error handling
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('🔄 Profile fetch error:', profileError.message);
            
            // 🔧 SIMPLIFIED: Create profile if it doesn't exist
            if (profileError.code === 'PGRST116') {
              console.log('🆕 Creating new profile...');
              
              const newProfile = {
                id: user.id,
                username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
                email: user.email || '',
                phone: user.phone || '',
                xp: 0,
                nights_out: 0,
                bars_hit: 0,
                drunk_scale_ratings: [],
                total_shots: 0,
                total_beers: 0,
                total_beer_towers: 0,
                total_funnels: 0,
                total_shotguns: 0,
                pool_games_won: 0,
                dart_games_won: 0,
                photos_taken: 0,
                profile_picture: null,
                visited_bars: [],
                xp_activities: [],
                has_completed_onboarding: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile)
                .select()
                .single();

              if (createError) {
                console.error('Failed to create profile:', createError.message);
                set({ isLoading: false, profile: null, profileReady: false });
                return;
              }

              // Use created profile
              const finalProfile = {
                ...createdProfile,
                friends: [],
                friend_requests: [],
              };

              set({
                profile: finalProfile,
                isLoading: false,
                profileReady: true
              });

              console.log('✅ New profile created and loaded');
              return;
            }
            
            // Other errors
            set({ isLoading: false, profile: null, profileReady: false });
            return;
          }

          // 🔧 CRITICAL: Set profile immediately with minimal data
          const finalProfile: UserProfile = {
            id: profileData.id,
            username: profileData.username,
            phone: profileData.phone || '',
            email: profileData.email,
            xp: profileData.xp || 0,
            nights_out: profileData.nights_out || 0,
            bars_hit: profileData.bars_hit || 0,
            drunk_scale_ratings: profileData.drunk_scale_ratings || [],
            last_night_out_date: profileData.last_night_out_date,
            last_drunk_scale_date: profileData.last_drunk_scale_date,
            profile_picture: profileData.profile_picture,
            friends: [], // Start empty, load later
            friend_requests: [], // Start empty, load later
            xp_activities: profileData.xp_activities || [],
            visited_bars: profileData.visited_bars || [],
            total_shots: profileData.total_shots || 0,
            total_beers: profileData.total_beers || 0,
            total_beer_towers: profileData.total_beer_towers || 0,
            total_funnels: profileData.total_funnels || 0,
            total_shotguns: profileData.total_shotguns || 0,
            pool_games_won: profileData.pool_games_won || 0,
            dart_games_won: profileData.dart_games_won || 0,
            photos_taken: profileData.photos_taken || 0,
            has_completed_onboarding: profileData.has_completed_onboarding || false,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at,
          };

          // 🔧 CRITICAL: Set profile ready IMMEDIATELY
          set({ 
            profile: finalProfile,
            isLoading: false,
            profileReady: true
          });

          console.log('✅ Profile loaded successfully:', finalProfile.username);

        } catch (error) {
          console.error('❌ Critical error in profile loading:', error);
          set({ 
            isLoading: false, 
            profile: null, 
            profileReady: false 
          });
        }
      },

      initializeProfile: async (userId: string) => {
        if (!isSupabaseConfigured() || !userId) {
          console.log('🔧 UserProfile: Creating demo profile for user:', userId);
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
          set({ profile: demoProfile, isInitialized: true, profileReady: true });
          return;
        }

        await get().loadProfile();
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

      // 🔧 ENHANCED: Better incrementNightsOut with date checking
      incrementNightsOut: async () => {
        const state = get();
        if (!state.profile) {
          console.error('❌ No profile available for incrementNightsOut');
          return;
        }

        // Check if already incremented today
        if (!state.canIncrementNightsOut()) {
          console.log('🌃 Nights out already incremented today');
          return;
        }

        try {
          const newNightsOut = state.profile.nights_out + 1;
          const today = new Date().toISOString();
          
          console.log('🌃 Incrementing nights out:', newNightsOut);
          
          // Update local state immediately
          set(currentState => ({
            profile: currentState.profile ? {
              ...currentState.profile,
              nights_out: newNightsOut,
              last_night_out_date: today,
              updated_at: today
            } : null
          }));

          // Add null check for supabase
          if (!supabase) {
            console.warn('🔄 Supabase client not available for nights out update');
            return;
          }

          // Get current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('❌ No authenticated user for nights out update');
            return;
          }

          // Update Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              nights_out: newNightsOut,
              last_night_out_date: today,
              updated_at: today
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('❌ Error updating nights_out in Supabase:', updateError);
            
            // Revert local state on error
            set(currentState => ({
              profile: currentState.profile ? {
                ...currentState.profile,
                nights_out: state.profile.nights_out, // Revert to original value
                last_night_out_date: state.profile.last_night_out_date,
                updated_at: new Date().toISOString()
              } : null
            }));
            return;
          }

          console.log('✅ Successfully incremented nights out to:', newNightsOut);
        } catch (error) {
          console.error('❌ Error in incrementNightsOut:', error);
          
          // Revert local state on error
          set(currentState => ({
            profile: currentState.profile ? {
              ...currentState.profile,
              nights_out: state.profile.nights_out, // Revert to original value
              last_night_out_date: state.profile.last_night_out_date,
              updated_at: new Date().toISOString()
            } : null
          }));
        }
      },

      // 🔧 ENHANCED: Better incrementBarsHit with immediate sync
      incrementBarsHit: async () => {
        const state = get();
        if (!state.profile) {
          console.error('❌ No profile available for incrementBarsHit');
          return;
        }

        try {
          const newBarsHit = state.profile.bars_hit + 1;
          
          console.log('🏛️ Incrementing bars hit:', newBarsHit);
          
          // Update local state immediately
          set(currentState => ({
            profile: currentState.profile ? {
              ...currentState.profile,
              bars_hit: newBarsHit,
              updated_at: new Date().toISOString()
            } : null
          }));

          // Add null check for supabase
          if (!supabase) {
            console.warn('🔄 Supabase client not available for bars hit update');
            return;
          }

          // Get current user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('❌ No authenticated user for bars hit update');
            return;
          }

          // Update Supabase
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              bars_hit: newBarsHit,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('❌ Error updating bars_hit in Supabase:', updateError);
            
            // Revert local state on error
            set(currentState => ({
              profile: currentState.profile ? {
                ...currentState.profile,
                bars_hit: state.profile.bars_hit, // Revert to original value
                updated_at: new Date().toISOString()
              } : null
            }));
            return;
          }

          console.log('✅ Successfully incremented bars hit to:', newBarsHit);
        } catch (error) {
          console.error('❌ Error in incrementBarsHit:', error);
          
          // Revert local state on error
          set(currentState => ({
            profile: currentState.profile ? {
              ...currentState.profile,
              bars_hit: state.profile.bars_hit, // Revert to original value
              updated_at: new Date().toISOString()
            } : null
          }));
        }
      },

      incrementPhotosTaken: async () => {
        const { profile } = get();
        if (!profile) return;
        const newPhotosTaken = (profile.photos_taken || 0) + 1;
        await get().updateProfile({ photos_taken: newPhotosTaken });
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
        await get().awardXP('drunk_scale_submission', `Submitted drunk scale rating: ${rating}/10`);
      },
      
      getAverageDrunkScale: () => {
        const { profile } = get();
        if (!profile || !profile.drunk_scale_ratings || profile.drunk_scale_ratings.length === 0) return 0;
        const sum = profile.drunk_scale_ratings.reduce((acc, rating) => acc + rating, 0);
        return Math.round((sum / profile.drunk_scale_ratings.length) * 10) / 10;
      },
      
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
        
        // Show task completion popup
        if (typeof window !== 'undefined') {
          (window as any).__showTaskCompletionPopup = {
            title: description,
            xpReward: xpAmount,
            type: 'task'
          };
        }
        
        // Trigger achievement checking after XP award
        setTimeout(() => {
          if (typeof window !== 'undefined' && (window as any).__achievementStore) {
            const achievementStore = (window as any).__achievementStore;
            if (achievementStore?.getState) {
              const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
              const currentProfile = get().profile;
              if (currentProfile) {
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

      // 🔧 FIX: Better stats sync that doesn't block profile loading
      syncStatsFromDailyStats: async () => {
        const { profile } = get();
        if (!profile || !isSupabaseConfigured()) {
          console.warn('❌ Cannot sync stats: No profile or Supabase not configured');
          return;
        }

        try {
          console.log('🔄 Syncing stats from daily_stats table...');
          
          // Add null check for supabase
          if (!supabase) {
            console.warn('🔄 Supabase client not available for stats sync');
            return;
          }
          
          const { data: dailyStats, error } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', profile.id);

          if (error) {
            console.error('Error syncing stats from daily_stats:', error);
            return;
          }

          if (!dailyStats || dailyStats.length === 0) return;

          const totals = dailyStats.reduce((acc, day) => ({
            total_beers: acc.total_beers + (day.beers || 0),
            total_shots: acc.total_shots + (day.shots || 0),
            total_beer_towers: acc.total_beer_towers + (day.beer_towers || 0),
            total_funnels: acc.total_funnels + (day.funnels || 0),
            total_shotguns: acc.total_shotguns + (day.shotguns || 0),
            pool_games_won: acc.pool_games_won + (day.pool_games_won || 0),
            dart_games_won: acc.dart_games_won + (day.dart_games_won || 0),
            nights_out: acc.nights_out + 1,
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

          await get().updateProfile(totals);
          console.log('✅ Stats synced from daily_stats table');
        } catch (error) {
          console.warn('Error syncing stats from daily_stats:', error);
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const state = get();
        if (!state.profile) {
          console.error('❌ No profile available for update');
          return;
        }

        try {
          console.log('🔄 Updating profile with:', updates);
          
          set({
            profile: { ...state.profile, ...updates },
            isUpdating: true
          });

          if (isSupabaseConfigured()) {
            // Add null check for supabase
            if (!supabase) {
              console.warn('🔄 Supabase client not available for profile update');
              set({ isUpdating: false });
              return;
            }
            
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
                  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
              }
            }
          }

          set({ isUpdating: false });

          // Trigger achievement checking after profile updates
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).__achievementStore) {
              const achievementStore = (window as any).__achievementStore;
              if (achievementStore?.getState) {
                const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
                const currentProfile = get().profile;
                if (currentProfile) {
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
          set({ profile: state.profile, isUpdating: false });
          throw error;
        }
      },

      loadFriends: async () => {
        const { profile } = get();
        if (!profile || !isSupabaseConfigured()) return;

        try {
          console.log('Loading friends...');
          set({ friends: [] });
          console.log('Friends loaded (placeholder implementation)');
        } catch (error) {
          console.error('Error loading friends:', error);
        }
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
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
        profileReady: state.profileReady,
      }),
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__userProfileStore = useUserProfileStore;
}