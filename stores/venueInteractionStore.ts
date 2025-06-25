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
  timestamp: string;
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
  getTimeSlotData: (venueId: string) => { time: string; count: number; likes: number }[];
  getAllInteractionsForVenue: (venueId: string) => VenueInteraction[];
  getDetailedTimeSlotData: (venueId: string) => { time: string; visits: number; likes: number; isCurrentHour: boolean; isPeak: boolean }[];
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
          if (!venueId) return;
          
          get().resetInteractionsIfNeeded();
          
          if (!get().canInteract(venueId)) return;
          
          const now = new Date().toISOString();
          let isNewBar = false;
          
          set((state) => {
            const existingInteraction = state.interactions.find(i => i && i.venueId === venueId);
            
            if (existingInteraction) {
              return {
                interactions: state.interactions.map(i => 
                  i && i.venueId === venueId 
                    ? { 
                        ...i, 
                        count: i.count + 1,
                        likes: i.likes + 1,
                        lastInteraction: now,
                        arrivalTime: arrivalTime || i.arrivalTime,
                        timestamp: now
                      } 
                    : i
                ).filter(Boolean) // Remove any null/undefined entries
              };
            } else {
              isNewBar = true;
              return {
                interactions: [
                  ...state.interactions.filter(Boolean), // Remove any null/undefined entries
                  { 
                    venueId, 
                    count: 1, 
                    likes: 1,
                    lastReset: now,
                    lastInteraction: now,
                    arrivalTime,
                    timestamp: now
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
          if (!venueId) return 0;
          get().resetInteractionsIfNeeded();
          const interaction = get().interactions.find(i => i && i.venueId === venueId);
          return interaction ? interaction.count : 0;
        } catch {
          return 0;
        }
      },
      
      getLikeCount: (venueId) => {
        try {
          if (!venueId) return 0;
          const interaction = get().interactions.find(i => i && i.venueId === venueId);
          return interaction ? interaction.likes : 0;
        } catch {
          return 0;
        }
      },
      
      getTotalLikes: () => {
        try {
          const { interactions } = get();
          return interactions
            .filter(Boolean) // Remove null/undefined entries
            .reduce((total, interaction) => total + (interaction?.likes || 0), 0);
        } catch {
          return 0;
        }
      },
      
      getMostPopularVenues: () => {
        try {
          const { interactions } = get();
          return interactions
            .filter(i => i && i.venueId)
            .map(i => ({ venueId: i.venueId, likes: i.likes || 0 }))
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 10);
        } catch {
          return [];
        }
      },
      
      getTimeSlotData: (venueId) => {
        try {
          if (!venueId) return [];
          
          const { interactions } = get();
          const venueInteractions = interactions.filter(i => i && i.venueId === venueId);
          
          // Create time slot counts
          const timeSlotCounts: Record<string, { count: number; likes: number }> = {};
          
          venueInteractions.forEach(interaction => {
            if (interaction && interaction.arrivalTime) {
              if (!timeSlotCounts[interaction.arrivalTime]) {
                timeSlotCounts[interaction.arrivalTime] = { count: 0, likes: 0 };
              }
              timeSlotCounts[interaction.arrivalTime].count += interaction.count || 0;
              timeSlotCounts[interaction.arrivalTime].likes += interaction.likes || 0;
            }
          });
          
          // Convert to array format
          return Object.entries(timeSlotCounts).map(([time, data]) => ({
            time: time || '',
            count: data?.count || 0,
            likes: data?.likes || 0
          }));
        } catch {
          return [];
        }
      },
      
      getAllInteractionsForVenue: (venueId) => {
        try {
          if (!venueId) return [];
          const { interactions } = get();
          return interactions.filter(i => i && i.venueId === venueId) || [];
        } catch {
          return [];
        }
      },

      getDetailedTimeSlotData: (venueId) => {
        try {
          if (!venueId) return [];
          
          const { interactions } = get();
          const venueInteractions = interactions.filter(i => i && i.venueId === venueId);
          
          const TIME_SLOTS = [
            '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', 
            '22:00', '22:30', '23:00', '23:30', '00:00', '00:30', 
            '01:00', '01:30', '02:00'
          ];

          // Get current time info
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();
          const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinutes >= 30 ? '30' : '00'}`;

          // Process each time slot
          const timeSlotData = TIME_SLOTS.map(timeSlot => {
            if (!timeSlot) {
              return {
                time: '',
                visits: 0,
                likes: 0,
                isCurrentHour: false,
                isPeak: false
              };
            }

            const slotInteractions = venueInteractions.filter(i => i && i.arrivalTime === timeSlot);
            const visits = slotInteractions.reduce((sum, i) => sum + (i?.count || 0), 0);
            const likes = slotInteractions.reduce((sum, i) => sum + (i?.likes || 0), 0);
            
            return {
              time: timeSlot,
              visits,
              likes,
              isCurrentHour: timeSlot === currentTimeSlot,
              isPeak: false // Will be calculated below
            };
          });

          // Mark peak times (top 3 by visits)
          const sortedByVisits = [...timeSlotData]
            .filter(slot => slot && slot.time)
            .sort((a, b) => b.visits - a.visits);
          const topSlots = sortedByVisits.slice(0, 3);
          
          timeSlotData.forEach(slot => {
            if (slot && slot.time) {
              slot.isPeak = topSlots.some(top => top && top.time === slot.time && top.visits > 0);
            }
          });

          return timeSlotData.filter(slot => slot && slot.time);
        } catch {
          return [];
        }
      },
      
      resetInteractionsIfNeeded: () => {
        try {
          set((state) => {
            const needsReset = state.interactions.some(
              i => i && shouldReset(i.lastReset)
            );
            
            if (needsReset) {
              return {
                interactions: state.interactions
                  .filter(Boolean) // Remove null/undefined entries
                  .map(i => i ? ({
                    ...i,
                    count: 0,
                    lastReset: new Date().toISOString(),
                    arrivalTime: undefined
                    // Keep likes - they don't reset daily
                  }) : i)
                  .filter(Boolean) // Remove any null/undefined entries again
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
          if (!venueId) return false;
          get().resetInteractionsIfNeeded();
          const interaction = get().interactions.find(i => i && i.venueId === venueId);
          return canInteractWithVenue(interaction?.lastInteraction);
        } catch {
          return true;
        }
      },
      
      getPopularArrivalTime: (venueId) => {
        try {
          if (!venueId) return null;
          
          const allInteractions = get().interactions.filter(i => 
            i && i.venueId === venueId && i.arrivalTime && i.count > 0
          );
          
          if (allInteractions.length === 0) return null;
          
          const timeCounts: Record<string, number> = {};
          allInteractions.forEach(interaction => {
            if (interaction && interaction.arrivalTime) {
              timeCounts[interaction.arrivalTime] = (timeCounts[interaction.arrivalTime] || 0) + (interaction.count || 0);
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