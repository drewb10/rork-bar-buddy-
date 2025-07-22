import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

// FEATURE: Core venue interactions (ALWAYS ENABLED)
// FEATURE: XP_SYSTEM (Conditionally enabled)
// FEATURE: ACHIEVEMENTS (Conditionally enabled) 
// FEATURE: STATS_TRACKING (Conditionally enabled)

interface VenueInteraction {
  venueId: string;
  count: number;
  lastReset: string;
  lastInteraction: string;
  arrivalTime?: string;
  likes: number;
  timestamp: string;
  lastLikeReset: string;
  dailyLikesUsed: number;
  likeTimeSlot?: string; // Time slot when user liked the venue
}

interface VenueInteractionState {
  interactions: VenueInteraction[];
  globalLikeCounts: Record<string, number>; // Cache global like counts - ALWAYS ENABLED
  
  // Core functions - ALWAYS ENABLED
  incrementInteraction: (venueId: string, arrivalTime?: string) => void;
  likeVenue: (venueId: string, timeSlot: string) => void;
  getInteractionCount: (venueId: string) => number;
  getLikeCount: (venueId: string) => number;
  getGlobalLikeCount: (venueId: string) => number; // Global likes - ALWAYS ENABLED
  getTotalLikes: () => number;
  resetInteractionsIfNeeded: () => void;
  canInteract: (venueId: string) => boolean;
  canLikeVenue: (venueId: string) => boolean;
  
  // Supabase integration - ALWAYS ENABLED for likes, conditional for other features
  syncLikesToSupabase: () => Promise<void>;
  fetchGlobalLikes: () => Promise<void>;
  
  // FEATURE: XP_SYSTEM functions (disabled in MVP)
  awardXP: (amount: number, reason: string) => void;
  
  // FEATURE: ACHIEVEMENTS functions (disabled in MVP)
  checkAchievements: (venueId?: string) => void;
  
  // FEATURE: STATS_TRACKING functions (disabled in MVP) 
  trackDetailedStats: (venueId: string, action: string, metadata?: any) => void;
}

export const useVenueInteractionStore = create<VenueInteractionState>()(
  persist(
    (set, get) => ({
      interactions: [],
      globalLikeCounts: {},

      // Core interaction functions - ALWAYS ENABLED
      incrementInteraction: (venueId: string, arrivalTime?: string) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        set((state) => {
          const existingInteraction = state.interactions.find(
            (interaction) => interaction.venueId === venueId
          );

          let updatedInteractions;
          if (existingInteraction) {
            // Check if we need to reset for a new day
            const lastInteractionDate = existingInteraction.lastReset;
            if (lastInteractionDate !== today) {
              // Reset count for new day
              updatedInteractions = state.interactions.map((interaction) =>
                interaction.venueId === venueId
                  ? { ...interaction, count: 1, lastReset: today, lastInteraction: now.toISOString(), arrivalTime }
                  : interaction
              );
            } else {
              // Increment existing interaction
              updatedInteractions = state.interactions.map((interaction) =>
                interaction.venueId === venueId
                  ? { ...interaction, count: interaction.count + 1, lastInteraction: now.toISOString(), arrivalTime }
                  : interaction
              );
            }
          } else {
            // Create new interaction
            const newInteraction: VenueInteraction = {
              venueId,
              count: 1,
              lastReset: today,
              lastInteraction: now.toISOString(),
              arrivalTime,
              likes: 0,
              timestamp: now.toISOString(),
              lastLikeReset: today,
              dailyLikesUsed: 0,
            };
            updatedInteractions = [...state.interactions, newInteraction];
          }

          return { interactions: updatedInteractions };
        });

        // FEATURE: XP_SYSTEM - Award XP for visiting venues (disabled in MVP)
        if (FEATURE_FLAGS.ENABLE_XP_SYSTEM) {
          get().awardXP(10, `Visited venue ${venueId}`);
        }

        // FEATURE: ACHIEVEMENTS - Check for achievements (disabled in MVP)
        if (FEATURE_FLAGS.ENABLE_ACHIEVEMENTS) {
          get().checkAchievements(venueId);
        }

        // FEATURE: STATS_TRACKING - Track detailed analytics (disabled in MVP)
        if (FEATURE_FLAGS.ENABLE_STATS_TRACKING) {
          get().trackDetailedStats(venueId, 'visit', { arrivalTime });
        }
      },

      // Core like function - ALWAYS ENABLED (This is core MVP functionality)
      likeVenue: async (venueId: string, timeSlot: string) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        set((state) => {
          const existingInteraction = state.interactions.find(
            (interaction) => interaction.venueId === venueId
          );

          let updatedInteractions;
          if (existingInteraction) {
            // Check if we need to reset likes for a new day
            if (existingInteraction.lastLikeReset !== today) {
              updatedInteractions = state.interactions.map((interaction) =>
                interaction.venueId === venueId
                  ? { ...interaction, likes: 1, lastLikeReset: today, dailyLikesUsed: 1, likeTimeSlot: timeSlot }
                  : interaction
              );
            } else {
              updatedInteractions = state.interactions.map((interaction) =>
                interaction.venueId === venueId
                  ? { ...interaction, likes: interaction.likes + 1, dailyLikesUsed: interaction.dailyLikesUsed + 1, likeTimeSlot: timeSlot }
                  : interaction
              );
            }
          } else {
            // Create new interaction for like
            const newInteraction: VenueInteraction = {
              venueId,
              count: 0,
              lastReset: today,
              lastInteraction: now.toISOString(),
              likes: 1,
              timestamp: now.toISOString(),
              lastLikeReset: today,
              dailyLikesUsed: 1,
              likeTimeSlot: timeSlot,
            };
            updatedInteractions = [...state.interactions, newInteraction];
          }

          // Update global like count optimistically
          const newGlobalLikeCounts = { 
            ...state.globalLikeCounts, 
            [venueId]: (state.globalLikeCounts[venueId] || 0) + 1 
          };

          return { 
            interactions: updatedInteractions, 
            globalLikeCounts: newGlobalLikeCounts 
          };
        });

        // Always sync likes to Supabase (core MVP functionality)
        try {
          await get().syncLikesToSupabase();
        } catch (error) {
          console.error('❌ Error syncing like to Supabase:', error);
        }

        // FEATURE: XP_SYSTEM - Award XP for likes (disabled in MVP)
        if (FEATURE_FLAGS.ENABLE_XP_SYSTEM) {
          get().awardXP(5, `Liked venue ${venueId}`);
        }

        // FEATURE: ACHIEVEMENTS - Check for like achievements (disabled in MVP)
        if (FEATURE_FLAGS.ENABLE_ACHIEVEMENTS) {
          get().checkAchievements(venueId);
        }

        // FEATURE: STATS_TRACKING - Track like analytics (disabled in MVP)
        if (FEATURE_FLAGS.ENABLE_STATS_TRACKING) {
          get().trackDetailedStats(venueId, 'like', { timeSlot });
        }
      },

      // Core getter functions - ALWAYS ENABLED
      getInteractionCount: (venueId: string) => {
        const interaction = get().interactions.find((i) => i.venueId === venueId);
        return interaction ? interaction.count : 0;
      },

      getLikeCount: (venueId: string) => {
        const interaction = get().interactions.find((i) => i.venueId === venueId);
        return interaction ? interaction.likes : 0;
      },

      getGlobalLikeCount: (venueId: string) => {
        return get().globalLikeCounts[venueId] || 0;
      },

      getTotalLikes: () => {
        return get().interactions.reduce((total, interaction) => total + interaction.likes, 0);
      },

      resetInteractionsIfNeeded: () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        set((state) => ({
          interactions: state.interactions.map((interaction) => {
            if (interaction.lastReset !== today) {
              return { ...interaction, count: 0, lastReset: today };
            }
            return interaction;
          }),
        }));
      },

      canInteract: (venueId: string) => {
        const interaction = get().interactions.find((i) => i.venueId === venueId);
        // Allow unlimited interactions for MVP simplicity
        return true;
      },

      canLikeVenue: (venueId: string) => {
        const interaction = get().interactions.find((i) => i.venueId === venueId);
        if (!interaction) return true;
        
        const today = new Date().toISOString().split('T')[0];
        if (interaction.lastLikeReset !== today) return true;
        
        // Allow 5 likes per venue per day for MVP
        return interaction.dailyLikesUsed < 5;
      },

      // Supabase integration - Core functionality for likes (ALWAYS ENABLED)
      syncLikesToSupabase: async () => {
        if (!isSupabaseConfigured()) {
          console.log('Supabase not configured, skipping like sync');
          return;
        }

        try {
          const { interactions } = get();
          
          // Sync likes to Supabase for each venue
          for (const interaction of interactions) {
            if (interaction.likes > 0) {
              // This would sync to bar_likes table
              const { error } = await supabase
                .from('bar_likes')
                .upsert({
                  venue_id: interaction.venueId,
                  user_id: 'anonymous', // MVP uses anonymous likes
                  likes_count: interaction.likes,
                  last_updated: new Date().toISOString()
                });

              if (error) {
                console.error('❌ Error syncing like to Supabase:', error);
              }
            }
          }

          // Fetch updated global counts
          await get().fetchGlobalLikes();
          
        } catch (error) {
          console.error('❌ Error in syncLikesToSupabase:', error);
        }
      },

      fetchGlobalLikes: async () => {
        if (!isSupabaseConfigured()) {
          console.log('Supabase not configured, using local like counts');
          return;
        }

        try {
          const { data, error } = await supabase
            .from('global_bar_likes')
            .select('venue_id, total_likes');

          if (error) {
            console.error('❌ Error loading global like counts:', error);
            return;
          }

          if (data) {
            const globalLikeCounts: Record<string, number> = {};
            data.forEach((item: any) => {
              globalLikeCounts[item.venue_id] = item.total_likes;
            });

            set({ globalLikeCounts });
          }
        } catch (error) {
          console.error('❌ Error fetching global likes:', error);
        }
      },

      // FEATURE: XP_SYSTEM functions (DISABLED IN MVP)
      awardXP: (amount: number, reason: string) => {
        if (!FEATURE_FLAGS.ENABLE_XP_SYSTEM) {
          return; // XP system disabled in MVP
        }

        // FEATURE: XP_SYSTEM - XP awarding logic preserved but disabled
        /* XP_SYSTEM: This would award XP to the user
        try {
          // Award XP logic here
          console.log(`Awarding ${amount} XP for: ${reason}`);
          // Integration with user profile store for XP
        } catch (error) {
          console.error('Error awarding XP:', error);
        }
        */
      },

      // FEATURE: ACHIEVEMENTS functions (DISABLED IN MVP)
      checkAchievements: (venueId?: string) => {
        if (!FEATURE_FLAGS.ENABLE_ACHIEVEMENTS) {
          return; // Achievement system disabled in MVP
        }

        // FEATURE: ACHIEVEMENTS - Achievement checking logic preserved but disabled
        /* ACHIEVEMENTS: This would check for achievement triggers
        try {
          // Achievement checking logic here
          const { interactions } = get();
          // Check various achievement conditions
          console.log('Checking achievements for venue:', venueId);
        } catch (error) {
          console.error('Error checking achievements:', error);
        }
        */
      },

      // FEATURE: STATS_TRACKING functions (DISABLED IN MVP)
      trackDetailedStats: (venueId: string, action: string, metadata?: any) => {
        if (!FEATURE_FLAGS.ENABLE_STATS_TRACKING) {
          return; // Detailed stats tracking disabled in MVP
        }

        // FEATURE: STATS_TRACKING - Detailed analytics preserved but disabled  
        /* STATS_TRACKING: This would track detailed user analytics
        try {
          // Detailed stats tracking logic here
          console.log('Tracking stat:', { venueId, action, metadata, timestamp: new Date() });
        } catch (error) {
          console.error('Error tracking detailed stats:', error);
        }
        */
      },
    }),
    {
      name: 'venue-interaction-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Initialize global likes on store creation
useVenueInteractionStore.getState().fetchGlobalLikes();

/* 
FEATURE: COMPLEX_VENUE_INTERACTIONS - PRESERVED CODE

The full complex venue interaction system with XP awards, achievement checking, 
and detailed analytics is preserved but disabled via feature flags.

To restore complex venue features:
1. Set feature flags to true in constants/featureFlags.ts:
   - ENABLE_XP_SYSTEM: true (for XP awarding on interactions)
   - ENABLE_ACHIEVEMENTS: true (for achievement checking)
   - ENABLE_STATS_TRACKING: true (for detailed analytics)

2. Uncomment the preserved code sections marked with FEATURE comments
3. Test all complex functionality
4. Verify Supabase integration works for complex features

Preserved functionality:
- XP awarding system for venue interactions and likes
- Achievement checking and progress tracking  
- Detailed user analytics and behavior tracking
- Complex venue interaction patterns
- Social interaction features

All preserved in the backup file: venueInteractionStore.ts.backup
*/