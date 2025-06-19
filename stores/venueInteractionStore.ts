import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VenueInteraction {
  venueId: string;
  count: number;
  lastReset: string; // ISO date string
  lastInteraction: string; // ISO date string
  arrivalTime?: string; // Time slot selected by user
}

interface VenueInteractionState {
  interactions: VenueInteraction[];
  incrementInteraction: (venueId: string, arrivalTime?: string) => void;
  getInteractionCount: (venueId: string) => number;
  resetInteractionsIfNeeded: () => void;
  canInteract: (venueId: string) => boolean;
  getPopularArrivalTime: (venueId: string) => string | null;
}

// Reset time is 5:00 AM
const RESET_HOUR = 5;

const shouldReset = (lastReset: string): boolean => {
  try {
    const lastResetDate = new Date(lastReset);
    const now = new Date();
    
    // If it's past 5 AM and the last reset was before today at 5 AM
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
    
    // 24-hour cooldown
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
      
      incrementInteraction: (venueId, arrivalTime) => {
        try {
          get().resetInteractionsIfNeeded();
          
          if (!get().canInteract(venueId)) return;
          
          set((state) => {
            const existingInteraction = state.interactions.find(i => i.venueId === venueId);
            const now = new Date().toISOString();
            
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
          // Get all interactions for this venue from all users/sessions
          const allInteractions = get().interactions.filter(i => 
            i.venueId === venueId && i.arrivalTime && i.count > 0
          );
          
          if (allInteractions.length === 0) return null;
          
          // Count occurrences of each arrival time across all interactions
          const timeCounts: Record<string, number> = {};
          allInteractions.forEach(interaction => {
            if (interaction.arrivalTime) {
              timeCounts[interaction.arrivalTime] = (timeCounts[interaction.arrivalTime] || 0) + interaction.count;
            }
          });
          
          if (Object.keys(timeCounts).length === 0) return null;
          
          // Find the maximum count
          const maxCount = Math.max(...Object.values(timeCounts));
          
          // Get all times that have the maximum count
          const popularTimes = Object.entries(timeCounts)
            .filter(([time, count]) => count === maxCount)
            .map(([time]) => time)
            .sort(); // Sort times for consistent display
          
          // Return times separated by slash if multiple, or single time
          return popularTimes.join('/');
        } catch {
          return null;
        }
      }
    }),
    {
      name: 'venue-interactions-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);