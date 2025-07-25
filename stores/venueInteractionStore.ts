import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
  globalLikeCounts: Record<string, number>; // Cache global like counts
  incrementInteraction: (venueId: string, arrivalTime?: string) => void;
  likeVenue: (venueId: string, timeSlot: string) => void;
  getInteractionCount: (venueId: string) => number;
  getLikeCount: (venueId: string) => number;
  getGlobalLikeCount: (venueId: string) => number; // New method for global likes
  getTotalLikes: () => number;
  resetInteractionsIfNeeded: () => void;
  canInteract: (venueId: string) => boolean;
  canLikeVenue: (venueId: string) => boolean;
  getPopularArrivalTime: (venueId: string) => string | null;
  getHotTimeWithLikes: (venueId: string) => { time: string; likes: number } | null;
  syncToSupabase: (venueId: string, arrivalTime?: string) => Promise<void>;
  syncLikeToSupabase: (venueId: string, timeSlot: string) => Promise<void>; // New method
  loadPopularTimesFromSupabase: () => Promise<void>;
  loadGlobalLikeCounts: () => Promise<void>; // New method
  getMostPopularVenues: () => { venueId: string; likes: number }[];
  getTimeSlotData: (venueId: string) => { time: string; count: number; likes: number }[];
  getAllInteractionsForVenue: (venueId: string) => VenueInteraction[];
  getDetailedTimeSlotData: (venueId: string) => { time: string; visits: number; likes: number; isCurrentHour: boolean; isPeak: boolean }[];
  // New methods for better syncing
  forceUpdate: () => void;
  getTotalBarsVisited: () => number;
}

const RESET_HOUR = 5;
const LIKE_RESET_HOUR = 4;
const LIKE_RESET_MINUTE = 59;
const INTERACTION_COOLDOWN_HOURS = 2;
const DAILY_LIKE_LIMIT = 1; // 1 like per bar per day

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

const shouldResetLikes = (lastLikeReset: string): boolean => {
  try {
    const lastResetDate = new Date(lastLikeReset);
    const now = new Date();
    
    // Reset at 4:59 AM
    const resetTime = new Date(now);
    resetTime.setHours(LIKE_RESET_HOUR, LIKE_RESET_MINUTE, 0, 0);
    
    // If it's past 4:59 AM today and last reset was before today's 4:59 AM, reset
    if (now >= resetTime && lastResetDate < resetTime) {
      return true;
    }
    
    // If it's before 4:59 AM today, check if last reset was before yesterday's 4:59 AM
    if (now < resetTime) {
      const yesterdayResetTime = new Date(resetTime);
      yesterdayResetTime.setDate(yesterdayResetTime.getDate() - 1);
      return lastResetDate < yesterdayResetTime;
    }
    
    return false;
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

// Debounce function to prevent rapid successive calls
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]): any => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
};

export const useVenueInteractionStore = create<VenueInteractionState>()(
  persist(
    (set, get): VenueInteractionState => ({
      interactions: [],
      globalLikeCounts: {}, // Initialize global like counts cache
      
      incrementInteraction: (venueId, arrivalTime) => {
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
                        lastInteraction: now,
                        arrivalTime: arrivalTime || i.arrivalTime,
                        timestamp: now
                      } 
                    : i
                ).filter(Boolean)
              };
            } else {
              isNewBar = true;
              return {
                interactions: [
                  ...state.interactions.filter(Boolean),
                  { 
                    venueId, 
                    count: 1, 
                    likes: 0,
                    lastReset: now,
                    lastInteraction: now,
                    arrivalTime,
                    timestamp: now,
                    lastLikeReset: now,
                    dailyLikesUsed: 0,
                  }
                ]
              };
            }
          });

          // Award XP through user profile store with debouncing
          debouncedAwardXP(venueId, isNewBar);
          
          // Update achievements
          debouncedUpdateAchievements();
          
          // Sync to Supabase
          get().syncToSupabase(venueId, arrivalTime);
        } catch (error) {
          console.warn('Error incrementing interaction:', error);
        }
      },

      likeVenue: (venueId, timeSlot) => {
        try {
          if (!venueId || !timeSlot) return;
          
          // Check if user can like this venue today
          if (!get().canLikeVenue(venueId)) return;
          
          const now = new Date().toISOString();
          
          set((state) => {
            const existingInteraction = state.interactions.find(i => i && i.venueId === venueId);
            
            if (existingInteraction) {
              // Reset daily likes if needed
              const shouldResetLikesForVenue = shouldResetLikes(existingInteraction.lastLikeReset);
              const dailyLikesUsed = shouldResetLikesForVenue ? 0 : existingInteraction.dailyLikesUsed;
              
              return {
                interactions: state.interactions.map(i => 
                  i && i.venueId === venueId 
                    ? { 
                        ...i, 
                        likes: i.likes + 1,
                        timestamp: now,
                        lastLikeReset: shouldResetLikesForVenue ? now : i.lastLikeReset,
                        dailyLikesUsed: dailyLikesUsed + 1,
                        likeTimeSlot: timeSlot,
                      } 
                    : i
                ).filter(Boolean),
                // Update global like count cache immediately
                globalLikeCounts: {
                  ...state.globalLikeCounts,
                  [venueId]: (state.globalLikeCounts[venueId] || 0) + 1
                }
              };
            } else {
              return {
                interactions: [
                  ...state.interactions.filter(Boolean),
                  { 
                    venueId, 
                    count: 0, 
                    likes: 1,
                    lastReset: now,
                    lastInteraction: '',
                    timestamp: now,
                    lastLikeReset: now,
                    dailyLikesUsed: 1,
                    likeTimeSlot: timeSlot,
                  }
                ],
                // Update global like count cache immediately
                globalLikeCounts: {
                  ...state.globalLikeCounts,
                  [venueId]: (state.globalLikeCounts[venueId] || 0) + 1
                }
              };
            }
          });

          // Award XP for liking a bar with debouncing
          debouncedAwardLikeXP(venueId);
          
          // Update achievements for bars visited
          debouncedUpdateAchievements();
          
          // Sync to Supabase for global like tracking
          get().syncLikeToSupabase(venueId, timeSlot);
          
          console.log('✅ Like venue completed, triggering re-render...');
          
          // Force update to trigger re-renders across components
          get().forceUpdate();
        } catch (error) {
          console.warn('Error liking venue:', error);
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
      
      getGlobalLikeCount: (venueId) => {
        try {
          if (!venueId) return 0;
          const { globalLikeCounts } = get();
          return globalLikeCounts[venueId] || 0;
        } catch {
          return 0;
        }
      },
      
      getTotalLikes: () => {
        try {
          const { interactions } = get();
          return interactions
            .filter(Boolean)
            .reduce((total, interaction) => total + (interaction?.likes || 0), 0);
        } catch {
          return 0;
        }
      },
      
      getTotalBarsVisited: () => {
        try {
          const { interactions } = get();
          return interactions
            .filter(i => i && i.venueId && (i.likes > 0 || i.count > 0))
            .length;
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

          const now = new Date();
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();
          const currentTimeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinutes >= 30 ? '30' : '00'}`;

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
              isPeak: false
            };
          });

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
            
            const needsLikeReset = state.interactions.some(
              i => i && shouldResetLikes(i.lastLikeReset || i.lastReset)
            );
            
            if (needsReset || needsLikeReset) {
              const now = new Date().toISOString();
              
              return {
                interactions: state.interactions
                  .filter(Boolean)
                  .map(i => {
                    if (!i) return i;
                    
                    const shouldResetInteraction = shouldReset(i.lastReset);
                    const shouldResetLikesForVenue = shouldResetLikes(i.lastLikeReset || i.lastReset);
                    
                    return {
                      ...i,
                      count: shouldResetInteraction ? 0 : i.count,
                      lastReset: shouldResetInteraction ? now : i.lastReset,
                      arrivalTime: shouldResetInteraction ? undefined : i.arrivalTime,
                      lastLikeReset: shouldResetLikesForVenue ? now : (i.lastLikeReset || i.lastReset),
                      dailyLikesUsed: shouldResetLikesForVenue ? 0 : (i.dailyLikesUsed || 0),
                      likeTimeSlot: shouldResetLikesForVenue ? undefined : i.likeTimeSlot,
                    };
                  })
                  .filter(Boolean)
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

      canLikeVenue: (venueId) => {
        try {
          if (!venueId) return false;
          
          get().resetInteractionsIfNeeded();
          
          const interaction = get().interactions.find(i => i && i.venueId === venueId);
          
          if (!interaction) return true; // Can like if no interaction exists
          
          // Check if likes have been reset today
          const shouldResetLikesForVenue = shouldResetLikes(interaction.lastLikeReset || interaction.lastReset);
          const dailyLikesUsed = shouldResetLikesForVenue ? 0 : (interaction.dailyLikesUsed || 0);
          
          return dailyLikesUsed < DAILY_LIKE_LIMIT;
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

      getHotTimeWithLikes: (venueId) => {
        try {
          if (!venueId) return null;
          
          const { interactions } = get();
          const venueInteractions = interactions.filter(i => i && i.venueId === venueId);
          
          const timeSlotLikes: Record<string, number> = {};
          
          venueInteractions.forEach(interaction => {
            if (interaction && interaction.likeTimeSlot && interaction.likes > 0) {
              timeSlotLikes[interaction.likeTimeSlot] = (timeSlotLikes[interaction.likeTimeSlot] || 0) + interaction.likes;
            }
          });
          
          if (Object.keys(timeSlotLikes).length === 0) return null;
          
          const maxLikes = Math.max(...Object.values(timeSlotLikes));
          const hotTimeEntry = Object.entries(timeSlotLikes).find(([time, likes]) => likes === maxLikes);
          
          if (!hotTimeEntry) return null;
          
          return {
            time: hotTimeEntry[0],
            likes: hotTimeEntry[1]
          };
        } catch {
          return null;
        }
      },

      forceUpdate: () => {
        set((state) => ({ ...state }));
      },

      syncToSupabase: async (venueId: string, arrivalTime?: string) => {
        try {
          // Mock implementation - would sync to Supabase in real app
        } catch (error) {
          console.warn('Error syncing venue interaction to Supabase:', error);
        }
      },

      syncLikeToSupabase: async (venueId: string, timeSlot: string) => {
        try {
          if (!isSupabaseConfigured() || !supabase) {
            console.log('⚠️ Supabase not configured, using local storage only');
            return;
          }

          // Get venue name from mocks - in real app this would come from API
          let venueName = 'Unknown Venue';
          try {
            const { venues } = require('@/mocks/venues');
            const venue = venues.find((v: any) => v.id === venueId);
            venueName = venue?.name || 'Unknown Venue';
          } catch (mockError) {
            console.warn('Could not load venue name from mocks:', mockError);
          }

          // Get current user ID - you'll need to get this from auth store
          const userStore = typeof window !== 'undefined' && (window as any).__authStore;
          let userId = 'demo-user';
          
          if (userStore?.getState) {
            const { user } = userStore.getState();
            userId = user?.id || 'demo-user';
          }

          // Try to sync to Supabase, but don't fail if it doesn't work
          try {
            const { data, error } = await supabase
              .from('bar_likes')
              .insert({
                user_id: userId,
                bar_id: venueId,
                bar_name: venueName,
                like_time_slot: timeSlot,
                liked_at: new Date().toISOString()
              })
              .select()
              .single();

            if (error) {
              console.warn('⚠️ Could not sync like to Supabase (app will continue working):', error.message);
            } else {
              console.log('✅ Like synced to Supabase:', data);
              
              // Try to refresh global like counts, but don't fail if it doesn't work
              try {
                await get().loadGlobalLikeCounts();
              } catch (loadError) {
                console.warn('Could not refresh global like counts:', loadError);
              }
            }
          } catch (supabaseError) {
            console.warn('⚠️ Supabase sync failed (app will continue working):', supabaseError);
          }
        } catch (error) {
          console.warn('⚠️ Error in syncLikeToSupabase (app will continue working):', error);
        }
      },

      loadGlobalLikeCounts: async () => {
        try {
          if (!isSupabaseConfigured() || !supabase) {
            console.log('⚠️ Supabase not configured, using local like counts only');
            return;
          }

          // Try to get all bar like counts from Supabase
          try {
            const { data, error } = await supabase
              .from('bar_likes')
              .select('bar_id, bar_name')
              .order('liked_at', { ascending: false });

            if (error) {
              console.warn('⚠️ Could not load global like counts (app will continue working):', error.message);
              return;
            }

            // Count likes per bar
            const likeCounts: Record<string, number> = {};
            data?.forEach((like) => {
              if (like.bar_id) {
                likeCounts[like.bar_id] = (likeCounts[like.bar_id] || 0) + 1;
              }
            });

            // Update the store with global counts
            set((state) => ({
              globalLikeCounts: likeCounts
            }));

            console.log('✅ Global like counts loaded:', likeCounts);
          } catch (supabaseError) {
            console.warn('⚠️ Supabase query failed (app will continue working):', supabaseError);
          }
        } catch (error) {
          console.warn('⚠️ Error in loadGlobalLikeCounts (app will continue working):', error);
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
      name: 'venue-interactions',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

// Debounced XP award functions to prevent rapid successive calls
const debouncedAwardXP = debounce((venueId: string, isNewBar: boolean) => {
  try {
    if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
      const userProfileStore = (window as any).__userProfileStore;
      if (userProfileStore?.getState) {
        const { awardXP, profile } = userProfileStore.getState();
        
        // Award XP for checking in
        awardXP('check_in', `Checked in at venue`, venueId);
        
        // Award XP for visiting a new bar
        if (isNewBar || !profile?.visited_bars?.includes(venueId)) {
          awardXP('visit_new_bar', `Visited a new bar`, venueId);
        }
      }
    }
  } catch (error) {
    console.warn('Error awarding XP:', error instanceof Error ? error.message : error);
  }
}, 300);

const debouncedAwardLikeXP = debounce((venueId: string) => {
  try {
    if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
      const userProfileStore = (window as any).__userProfileStore;
      if (userProfileStore?.getState) {
        const { awardXP } = userProfileStore.getState();
        awardXP('like_bar', `Liked a bar`, venueId);
      }
    }
  } catch (error) {
    console.warn('Error awarding like XP:', error instanceof Error ? error.message : error);
  }
}, 300);

// Debounced achievement update function
const debouncedUpdateAchievements = debounce(() => {
  try {
    if (typeof window !== 'undefined' && (window as any).__achievementStore && (window as any).__userProfileStore) {
      const achievementStore = (window as any).__achievementStore;
      const userProfileStore = (window as any).__userProfileStore;
      
      if (achievementStore?.getState && userProfileStore?.getState) {
        const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
        const { profile } = userProfileStore.getState();
        
        if (profile) {
          checkAndUpdateMultiLevelAchievements({
            totalBeers: profile.total_beers || 0,
            totalShots: profile.total_shots || 0,
            totalBeerTowers: profile.total_beer_towers || 0,
            totalScoopAndScores: 0, // Not tracked
            totalFunnels: profile.total_funnels || 0,
            totalShotguns: profile.total_shotguns || 0,
            poolGamesWon: profile.pool_games_won || 0,
            dartGamesWon: profile.dart_games_won || 0,
            barsHit: profile.bars_hit || 0,
            nightsOut: profile.nights_out || 0,
          });
        }
      }
    }
  } catch (error) {
    console.warn('Error updating achievements:', error instanceof Error ? error.message : error);
  }
}, 500);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__venueInteractionStore = useVenueInteractionStore;
}