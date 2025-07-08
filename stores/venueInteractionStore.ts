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
  lastLikeReset: string;
  dailyLikesUsed: number;
  likeTimeSlot?: string;
}

interface VenueInteractionState {
  interactions: VenueInteraction[];
  incrementInteraction: (venueId: string, arrivalTime?: string) => void;
  likeVenue: (venueId: string, timeSlot: string) => void;
  getInteractionCount: (venueId: string) => number;
  getLikeCount: (venueId: string) => number;
  getTotalLikes: () => number;
  resetInteractionsIfNeeded: () => void;
  canInteract: (venueId: string) => boolean;
  canLikeVenue: (venueId: string) => boolean;
  getPopularArrivalTime: (venueId: string) => string | null;
  getHotTimeWithLikes: (venueId: string) => { time: string; likes: number } | null;
  syncToSupabase: (venueId: string, arrivalTime?: string) => Promise<void>;
  loadPopularTimesFromSupabase: () => Promise<void>;
  getMostPopularVenues: () => { venueId: string; likes: number }[];
  getTimeSlotData: (venueId: string) => { time: string; count: number; likes: number }[];
  getAllInteractionsForVenue: (venueId: string) => VenueInteraction[];
  getDetailedTimeSlotData: (venueId: string) => { time: string; visits: number; likes: number; isCurrentHour: boolean; isPeak: boolean }[];
  forceUpdate: () => void;
  getTotalBarsVisited: () => number;
}

const RESET_HOUR = 5;
const LIKE_RESET_HOUR = 4;
const LIKE_RESET_MINUTE = 59;
const INTERACTION_COOLDOWN_HOURS = 2;
const DAILY_LIKE_LIMIT = 1;

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
    
    const resetTime = new Date(now);
    resetTime.setHours(LIKE_RESET_HOUR, LIKE_RESET_MINUTE, 0, 0);
    
    if (now >= resetTime && lastResetDate < resetTime) {
      return true;
    }
    
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

const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
};

export const useVenueInteractionStore = create<VenueInteractionState>()(
  persist(
    (set, get) => ({
      interactions: [],
      
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

          debouncedAwardXP(venueId, isNewBar);
          debouncedUpdateAchievements();
          get().syncToSupabase(venueId, arrivalTime);
        } catch (error) {
          console.warn('Error incrementing interaction:', error);
        }
      },

      // 🔧 FIXED: Remove XP award from liking venues
      likeVenue: (venueId, timeSlot) => {
        try {
          if (!venueId || !timeSlot) return;
          
          if (!get().canLikeVenue(venueId)) return;
          
          const now = new Date().toISOString();
          
          set((state) => {
            const existingInteraction = state.interactions.find(i => i && i.venueId === venueId);
            
            if (existingInteraction) {
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
                ).filter(Boolean)
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
                ]
              };
            }
          });

          // Update achievements for bars visited
          debouncedUpdateAchievements();

          // Sync task progress for "Like bars" tasks
          setTimeout(() => {
            if (typeof window !== 'undefined' && (window as any).__achievementStore) {
              const achievementStore = (window as any).__achievementStore;
              if (achievementStore?.getState) {
                const { updateAchievementProgress, achievements } = achievementStore.getState();
                
                const likeBarTasks = achievements.filter((task: any) => 
                  task.title.toLowerCase().includes('like') && 
                  task.title.toLowerCase().includes('bar') &&
                  !task.completed
                );
                
                likeBarTasks.forEach((task: any) => {
                  const currentProgress = task.progress || 0;
                  updateAchievementProgress(task.baseId, currentProgress + 1);
                });

                console.log('🔥 Updated like bar task progress for', likeBarTasks.length, 'tasks');
              }
            }
          }, 100);
          
          console.log('✅ Like venue completed with task sync, triggering re-render...');
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
          
          if (!interaction) return true;
          
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

// Debounced XP award functions - REMOVED like XP award
const debouncedAwardXP = debounce((venueId: string, isNewBar: boolean) => {
  try {
    if (typeof window !== 'undefined' && (window as any).__userProfileStore) {
      const userProfileStore = (window as any).__userProfileStore;
      if (userProfileStore?.getState) {
        const { awardXP, profile } = userProfileStore.getState();
        
        awardXP('check_in', `Checked in at venue`, venueId);
        
        if (isNewBar || !profile?.visited_bars?.includes(venueId)) {
          awardXP('visit_new_bar', `Visited a new bar`, venueId);
        }
      }
    }
  } catch (error) {
    console.warn('Error awarding XP:', error);
  }
}, 300);

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
            totalScoopAndScores: 0,
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
    console.warn('Error updating achievements:', error);
  }
}, 500);

if (typeof window !== 'undefined') {
  (window as any).__venueInteractionStore = useVenueInteractionStore;
}