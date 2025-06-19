import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface VenueInteraction {
  venueId: string;
  count: number;
  lastReset: string;
  lastInteraction: string;
  arrivalTime?: string;
}

interface VenueInteractionState {
  interactions: VenueInteraction[];
  incrementInteraction: (venueId: string, arrivalTime?: string) => void;
  getInteractionCount: (venueId: string) => number;
  resetInteractionsIfNeeded: () => void;
  canInteract: (venueId: string) => boolean;
  getPopularArrivalTime: (venueId: string) => string | null;
  syncToSupabase: (venueId: string, arrivalTime?: string) => Promise<void>;
  loadPopularTimesFromSupabase: () => Promise<void>;
}

const RESET_HOUR = 5;

const shouldReset = (lastReset: string): boolean => {
  try {
    const lastResetDate = new Date(lastReset);
    const now = new Date();
    
    const resetTime = new Date(now);
    resetTime.setHours(RESET_HOUR, 0, 0, 0);
    
    return now >= resetTime && lastResetDate < resetTime;
  } catch {
    return false;
  }
};

const canInteractWithVenue = (lastInteraction: string | undefined): boolean => {
  try {
    if (!lastInteraction) return true;
    
    const lastInteractionDate = new Date(lastInteraction);
    const now = new Date();
    
    const cooldownTime = new Date(lastInteractionDate);
    cooldownTime.setHours(cooldownTime.getHours() + 24);
    
    return now >= cooldownTime;
  } catch {
    return true;
  }
};

export const useVenueInteractionStore = create<VenueInteractionState>()(
  persist(
    (set, get) => ({
      interactions: [],
      
      incrementInteraction: async (venueId, arrivalTime) => {
        try {
          get().resetInteractionsIfNeeded();
          
          if (!get().canInteract(venueId)) return;
          
          const now = new Date().toISOString();
          
          set((state) => {
            const existingInteraction = state.interactions.find(i => i.venueId === venueId);
            
            if (existingInteraction) {
              return {
                interactions: state.interactions.map(i => 
                  i.venueId === venueId 
                    ? { 
                        ...i, 
                        count: i.count + 1,
                        lastInteraction: now,
                        arrivalTime: arrivalTime || i.arrivalTime
                      } 
                    : i
                )
              };
            } else {
              return {
                interactions: [
                  ...state.interactions, 
                  { 
                    venueId, 
                    count: 1, 
                    lastReset: now,
                    lastInteraction: now,
                    arrivalTime
                  }
                ]
              };
            }
          });

          // Sync to Supabase
          await get().syncToSupabase(venueId, arrivalTime);
        } catch (error) {
          console.warn('Error incrementing interaction:', error);
        }
      },
      
      getInteractionCount: (venueId) => {
        try {
          get().resetInteractionsIfNeeded();
          const interaction = get().interactions.find(i => i.venueId === venueId);
          return interaction ? interaction.count : 0;
        } catch {
          return 0;
        }
      },
      
      resetInteractionsIfNeeded: () => {
        try {
          set((state) => {
            const needsReset = state.interactions.some(
              i => shouldReset(i.lastReset)
            );
            
            if (needsReset) {
              return {
                interactions: state.interactions.map(i => ({
                  ...i,
                  count: 0,
                  lastReset: new Date().toISOString(),
                  arrivalTime: undefined
                }))
              };
            }
            
            return state;
          });
        } catch (error) {
          console.warn('Error resetting interactions:', error);
        }
      },
      
      canInteract: (venueId) => {
        try {
          get().resetInteractionsIfNeeded();
          const interaction = get().interactions.find(i => i.venueId === venueId);
          return canInteractWithVenue(interaction?.lastInteraction);
        } catch {
          return true;
        }
      },
      
      getPopularArrivalTime: (venueId) => {
        try {
          const allInteractions = get().interactions.filter(i => 
            i.venueId === venueId && i.arrivalTime && i.count > 0
          );
          
          if (allInteractions.length === 0) return null;
          
          const timeCounts: Record<string, number> = {};
          allInteractions.forEach(interaction => {
            if (interaction.arrivalTime) {
              timeCounts[interaction.arrivalTime] = (timeCounts[interaction.arrivalTime] || 0) + interaction.count;
            }
          });
          
          if (Object.keys(timeCounts).length === 0) return null;
          
          const maxCount = Math.max(...Object.values(timeCounts));
          
          const popularTimes = Object.entries(timeCounts)
            .filter(([time, count]) => count === maxCount)
            .map(([time]) => time)
            .sort();
          
          return popularTimes.join('/');
        } catch {
          return null;
        }
      },

      syncToSupabase: async (venueId: string, arrivalTime?: string) => {
        try {
          // Get current user profile to get user_id
          const userProfileStore = (window as any).__userProfileStore;
          if (!userProfileStore?.getState?.()?.profile?.userId) return;

          const userId = userProfileStore.getState().profile.userId;
          if (userId === 'default') return;

          const { error } = await supabase
            .from('venue_interactions')
            .insert({
              user_id: userId,
              venue_id: venueId,
              interaction_type: 'like',
              arrival_time: arrivalTime,
              timestamp: new Date().toISOString(),
              session_id: Math.random().toString(36).substr(2, 9),
            });

          if (error) {
            console.warn('Failed to sync venue interaction to Supabase:', error);
          }
        } catch (error) {
          console.warn('Error syncing venue interaction to Supabase:', error);
        }
      },

      loadPopularTimesFromSupabase: async () => {
        try {
          const { data, error } = await supabase
            .from('venue_interactions')
            .select('venue_id, arrival_time')
            .not('arrival_time', 'is', null);

          if (error) {
            console.warn('Failed to load popular times from Supabase:', error);
            return;
          }

          // Process the data to update local popular times
          // This is a simplified version - in production you'd want more sophisticated analytics
          const venueTimeCounts: Record<string, Record<string, number>> = {};
          
          data?.forEach(interaction => {
            if (!venueTimeCounts[interaction.venue_id]) {
              venueTimeCounts[interaction.venue_id] = {};
            }
            if (interaction.arrival_time) {
              venueTimeCounts[interaction.venue_id][interaction.arrival_time] = 
                (venueTimeCounts[interaction.venue_id][interaction.arrival_time] || 0) + 1;
            }
          });

          // Update local state with popular times from cloud data
          // This would be used to show global popular times vs just local user data
        } catch (error) {
          console.warn('Error loading popular times from Supabase:', error);
        }
      }
    }),
    {
      name: 'venue-interactions-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__venueInteractionStore = useVenueInteractionStore;
}