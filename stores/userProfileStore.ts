import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, safeSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, XPActivity, Friend } from '@/types';

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
  friends: Friend[];
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

      // 🔧 ULTRA-SIMPLIFIED: Direct profile loading with timeout protection
      loadProfile: async () => {
        const state = get();
        
        // Prevent multiple concurrent loads
        if (state.isLoading) {
          console.log('🔄 Profile load already in progress, skipping...');
          return;
        }

        // Set a timeout to prevent hanging
        const loadTimeout = setTimeout(() => {
          console.warn('⚠️ Profile load timeout, using demo profile...');
          const demoProfile: UserProfile = {
            id: 'demo-timeout-user',
            username: 'Demo User',
            phone: '',
            email: 'demo@barbuddy.com',
            xp: 150,
            nights_out: 3,
            bars_hit: 5,
            drunk_scale_ratings: [6, 7, 5],
            total_shots: 12,
            total_beers: 8,
            total_beer_towers: 2,
            total_funnels: 3,
            total_shotguns: 1,
            pool_games_won: 2,
            dart_games_won: 1,
            photos_taken: 15,
            profile_picture: undefined,
            friends: [],
            friend_requests: [],
            xp_activities: [],
            visited_bars: ['library-taphouse', 'late-night-library'],
            has_completed_onboarding: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          set({ 
            profile: demoProfile,
            isLoading: false,
            profileReady: true
          });
        }, 3000); // 3 second timeout

        try {
          set({ isLoading: true, profileReady: false });
          console.log('🔄 Starting ultra-simplified profile load...');
          
          // Check if Supabase is configured
          if (!isSupabaseConfigured()) {
            console.log('🔄 Supabase not configured, creating demo profile...');
            
            // Create a demo profile for testing
            const demoProfile: UserProfile = {
              id: 'demo-user',
              username: 'Demo User',
              phone: '',
              email: 'demo@barbuddy.com',
              xp: 150,
              nights_out: 3,
              bars_hit: 5,
              drunk_scale_ratings: [6, 7, 5],
              total_shots: 12,
              total_beers: 8,
              total_beer_towers: 2,
              total_funnels: 3,
              total_shotguns: 1,
              pool_games_won: 2,
              dart_games_won: 1,
              photos_taken: 15,
              profile_picture: undefined,
              friends: [],
              friend_requests: [],
              xp_activities: [],
              visited_bars: ['library-taphouse', 'late-night-library'],
              has_completed_onboarding: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            set({ 
              profile: demoProfile,
              isLoading: false,
              profileReady: true
            });

            console.log('✅ Demo profile created successfully');
            return;
          }
          
          // Direct Supabase auth call
          const { data: { user }, error: authError } = await safeSupabase!.auth.getUser();
          
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

          // Direct profile fetch
          const { data: profileData, error: profileError } = await safeSupabase!
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('🔄 Profile fetch error:', profileError.message);
            
            // Create profile if it doesn't exist
            if (profileError && 'code' in profileError && profileError.code === 'PGRST116') {
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
                profile_picture: undefined,
                visited_bars: [],
                xp_activities: [],
                has_completed_onboarding: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              const { data: createdProfile, error: createError } = await safeSupabase!
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

          // Set profile immediately with minimal data
          const finalProfile = {
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

          // Set profile ready IMMEDIATELY
          set({ 
            profile: finalProfile,
            isLoading: false,
            profileReady: true
          });

          console.log('✅ Profile loaded successfully:', finalProfile.username);
          
          // Clear the timeout since we completed successfully
          clearTimeout(loadTimeout);

        } catch (error) {
          console.error('❌ Critical error in profile loading:', error);
          
          // Clear timeout and set fallback
          clearTimeout(loadTimeout);
          
          set({ 
            isLoading: false, 
            profile: null, 
            profileReady: true // Set to true to prevent blocking
          });
        }
      },

      initializeProfile: async (userId: string) => {
        try {
          console.log('🔄 Initializing profile for user:', userId);
          
          if (!isSupabaseConfigured()) {
            console.log('🔄 Supabase not configured, skipping profile initialization');
            return;
          }

          // Load the profile
          await get().loadProfile();
        } catch (error) {
          console.error('❌ Error initializing profile:', error);
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const state = get();
        if (!state.profile) return;

        try {
          set({ isUpdating: true });

          if (isSupabaseConfigured() && supabase) {
            const { error } = await supabase
              .from('profiles')
              .update({
                ...updates,
                updated_at: new Date().toISOString()
              })
              .eq('id', state.profile.id);

            if (error) {
              console.error('Error updating profile:', error);
              return;
            }
          }

          // Update local state
          set({
            profile: {
              ...state.profile,
              ...updates,
              updated_at: new Date().toISOString()
            },
            isUpdating: false
          });

          console.log('✅ Profile updated successfully');
        } catch (error) {
          console.error('❌ Error updating profile:', error);
          set({ isUpdating: false });
        }
      },

      awardXP: async (type: XPType, description: string, venueId?: string) => {
        const state = get();
        if (!state.profile) return;

        try {
          const xpAmount = XP_VALUES[type];
          const newXP = state.profile.xp + xpAmount;

          const activity: XPActivity = {
            id: Date.now().toString(),
            type,
            description,
            xpAwarded: xpAmount,
            timestamp: new Date().toISOString()
          };

          const updatedActivities = [activity, ...(state.profile.xp_activities || [])].slice(0, 50);

          await get().updateProfile({
            xp: newXP,
            xp_activities: updatedActivities
          });

          console.log(`✅ Awarded ${xpAmount} XP for ${type}: ${description}`);
        } catch (error) {
          console.error('❌ Error awarding XP:', error);
        }
      },

      incrementNightsOut: async () => {
        const state = get();
        if (!state.profile) return;

        if (!get().canIncrementNightsOut()) {
          console.log('🌃 Nights out already incremented today');
          return;
        }

        try {
          const newNightsOut = state.profile.nights_out + 1;
          const today = new Date().toISOString();
          
          await get().updateProfile({
            nights_out: newNightsOut,
            last_night_out_date: today
          });

          console.log('✅ Incremented nights out to:', newNightsOut);
        } catch (error) {
          console.error('❌ Error incrementing nights out:', error);
        }
      },

      incrementBarsHit: async () => {
        const state = get();
        if (!state.profile) return;

        try {
          const newBarsHit = state.profile.bars_hit + 1;
          
          await get().updateProfile({
            bars_hit: newBarsHit
          });

          console.log('✅ Incremented bars hit to:', newBarsHit);
        } catch (error) {
          console.error('❌ Error incrementing bars hit:', error);
        }
      },

      incrementPhotosTaken: async () => {
        const state = get();
        if (!state.profile) return;

        try {
          const newPhotosTaken = state.profile.photos_taken + 1;
          
          await get().updateProfile({
            photos_taken: newPhotosTaken
          });

          console.log('✅ Incremented photos taken to:', newPhotosTaken);
        } catch (error) {
          console.error('❌ Error incrementing photos taken:', error);
        }
      },

      addDrunkScaleRating: async (rating: number) => {
        const state = get();
        if (!state.profile) return;

        try {
          const newRatings = [...(state.profile.drunk_scale_ratings || []), rating];
          
          await get().updateProfile({
            drunk_scale_ratings: newRatings,
            last_drunk_scale_date: new Date().toISOString()
          });

          console.log('✅ Added drunk scale rating:', rating);
        } catch (error) {
          console.error('❌ Error adding drunk scale rating:', error);
        }
      },

      getAverageDrunkScale: () => {
        const state = get();
        if (!state.profile?.drunk_scale_ratings || state.profile.drunk_scale_ratings.length === 0) {
          return 0;
        }

        const sum = state.profile.drunk_scale_ratings.reduce((acc, rating) => acc + rating, 0);
        return Math.round((sum / state.profile.drunk_scale_ratings.length) * 10) / 10;
      },

      canIncrementNightsOut: () => {
        const state = get();
        if (!state.profile) return false;

        const today = new Date().toDateString();
        const lastNightOut = state.profile.last_night_out_date 
          ? new Date(state.profile.last_night_out_date).toDateString()
          : null;

        return today !== lastNightOut;
      },

      syncStatsFromDailyStats: async () => {
        // Simplified implementation - just log for now
        console.log('📊 Stats sync requested (simplified implementation)');
      },

      setProfilePicture: async (uri: string) => {
        await get().updateProfile({ profile_picture: uri });
      },

      loadFriends: async () => {
        try {
          if (!isSupabaseConfigured() || !supabase) {
            console.log('👥 Supabase not configured, using empty friends list');
            set({ friends: [] });
            return;
          }

          const state = get();
          if (!state.profile) {
            console.log('👥 No profile available for loading friends');
            return;
          }

          // Use the correct table name 'profiles' instead of 'user_profiles'
          const { data: friendsData, error } = await supabase
            .from('friends')
            .select(`
              friend_user_id,
              profiles!friends_friend_user_id_fkey (
                id,
                username,
                phone,
                email,
                xp,
                nights_out,
                bars_hit,
                created_at
              )
            `)
            .eq('user_id', state.profile.id);

          if (error) {
            console.error('❌ Error loading friends:', error);
            // Set empty friends list on error to prevent crashes
            set({ friends: [] });
            return;
          }

          // Transform the data to match our Friend interface
          const friends: Friend[] = (friendsData || []).map((item: any) => ({
            id: item.profiles.id,
            username: item.profiles.username,
            phone: item.profiles.phone || '',
            email: item.profiles.email,
            xp: item.profiles.xp || 0,
            nights_out: item.profiles.nights_out || 0,
            bars_hit: item.profiles.bars_hit || 0,
            rank_title: 'Newbie', // Default rank
            created_at: item.profiles.created_at,
          }));

          set({ friends });
          console.log(`👥 Loaded ${friends.length} friends successfully`);
        } catch (error) {
          console.error('❌ Error loading friends:', error);
          // Set empty friends list on error to prevent crashes
          set({ friends: [] });
        }
      }
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile ? {
          id: state.profile.id,
          username: state.profile.username,
          phone: state.profile.phone,
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
      }),
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__userProfileStore = useUserProfileStore;
}