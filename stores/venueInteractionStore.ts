import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VenueInteraction {
  venueId: string;
  count: number;
  lastReset: string;
  lastInteraction: string;
  arrivalTime?: string;
  likes: number;
}

interface VenueInteractionState {
  interactions: VenueInteraction[];
  incrementInteraction: (venueId: string, arrivalTime?: string) => void;
  getInteractionCount: (venueId: string) => number;
  getLikeCount: (venueId: string) => number;
  resetInteractionsIfNeeded: () => void;
  canInteract: (venueId: string) => boolean;
  getPopularArrivalTime: (venueId: string) => string | null;
  syncToSupabase: (venueId: string, arrivalTime?: string) => Promise<void>;
  loadPopularTimesFromSupabase: () => Promise<void>;
  getTotalLikes: () => number;
  getMostPopularVenues: () => { venueId: string; likes: number }[];
}

const RESET_HOUR = 5;
const INTERACTION_COOLDOWN_HOURS = 2; // Reduced from 24 hours to 2 hours

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
    cooldownTime.setHours(cooldownTime.getHours() + INTERACTION_COOLDOWN_HOURS);
    
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
          let isNewBar = false;
          
          set((state) => {
            const existingInteraction = state.interactions.find(i => i.venueId === venueId);
            
            if (existingInteraction) {
              return {
                interactions: state.interactions.map(i => 
                  i.venueId === venueId 
                    ? { 
                        ...i, 
                        count: i.count + 1,
                        likes: i.likes + 1,
                        lastInteraction: now,
                        arrivalTime: arrivalTime || i.arrivalTime
                      } 
                    : i
                )
              };
            } else {
              isNewBar = true;
              return {
                interactions: [
                  ...state.interactions, 
                  { 
                    venueId, 
                    count: 1, 
                    likes: 1,
                    lastReset: now,
                    lastInteraction: now,
                    arrivalTime
                  }
                ]
              };
            }
          });

          // Award XP through user profile store
          const userProfileStore = (window as any).__userProfileStore;
          if (userProfileStore?.getState) {
            const { awardXP, profile } = userProfileStore.getState();
            
            // Award XP for visiting a new bar
            if (isNewBar || !profile.visitedBars.includes(venueId)) {
              awardXP('visit_new_bar', `Visited a new bar`, venueId);
            }
          }

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
      
      getLikeCount: (venueId) => {
        try {
          const interaction = get().interactions.find(i => i.venueId === venueId);
          return interaction ? interaction.likes : 0;
        } catch {
          return 0;
        }
      },
      
      getTotalLikes: () => {
        try {
          const { interactions } = get();
          return interactions.reduce((total, interaction) => total + interaction.likes, 0);
        } catch {
          return 0;
        }
      },
      
      getMostPopularVenues: () => {
        try {
          const { interactions } = get();
          return interactions
            .map(i => ({ venueId: i.venueId, likes: i.likes }))
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 10);
        } catch {
          return [];
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
                  // Keep likes - they don't reset daily
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
          // Mock implementation - would sync to Supabase in real app
        } catch (error) {
          console.warn('Error syncing venue interaction to Supabase:', error);
        }
      },

      loadPopularTimesFromSupabase: async () => {
        try {
          // Mock implementation - would load from Supabase in real app
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