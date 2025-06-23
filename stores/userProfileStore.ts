import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Friend {
  userId: string;
  name: string;
  profilePicture?: string;
  nightsOut: number;
  barsHit: number;
  rankTitle: string;
  addedAt: string;
  xp: number;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserProfilePicture?: string;
  fromUserRank: string;
  sentAt: string;
}

interface XPActivity {
  id: string;
  type: 'visit_new_bar' | 'participate_event' | 'bring_friend' | 'complete_night_out' | 'special_achievement' | 'live_music' | 'featured_drink' | 'bar_game' | 'photo_taken' | 'shots' | 'scoop_and_scores' | 'beers' | 'beer_towers' | 'funnels' | 'shotguns' | 'pool_games_won' | 'dart_games_won';
  xpAwarded: number;
  timestamp: string;
  description: string;
}

interface DailyStats {
  shots: number;
  scoopAndScores: number;
  beers: number;
  beerTowers: number;
  funnels: number;
  shotguns: number;
  poolGamesWon: number;
  dartGamesWon: number;
  lastReset: string;
}

interface VenueSpecificActivity {
  venueId: string;
  activityType: 'pool_win' | 'dart_win' | 'group_shot';
  timestamp: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  joinDate: string;
  nightsOut: number;
  barsHit: number;
  drunkScaleRatings: number[];
  lastNightOutDate?: string;
  lastDrunkScaleDate?: string;
  profilePicture?: string;
  userId?: string;
  hasCustomizedProfile?: boolean;
  hasCompletedOnboarding?: boolean;
  friends: Friend[];
  friendRequests: FriendRequest[];
  xp: number;
  xpActivities: XPActivity[];
  visitedBars: string[];
  eventsAttended: number;
  friendsReferred: number;
  liveEventsAttended: number;
  featuredDrinksTried: number;
  barGamesPlayed: number;
  photosTaken: number;
  totalShots: number;
  totalScoopAndScores: number;
  totalBeers: number;
  totalBeerTowers: number;
  totalFunnels: number;
  totalShotguns: number;
  totalPoolGamesWon: number;
  totalDartGamesWon: number;
  dailyStats: DailyStats;
  venueSpecificActivities: VenueSpecificActivity[];
}

interface RankInfo {
  tier: number;
  subRank: number;
  title: string;
  subTitle: string;
  color: string;
  minXP: number;
  maxXP: number;
}

interface UserProfileState {
  profile: UserProfile;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  incrementNightsOut: () => void;
  incrementBarsHit: () => void;
  addDrunkScaleRating: (rating: number) => void;
  getAverageDrunkScale: () => number;
  getRank: () => RankInfo;
  canIncrementNightsOut: () => boolean;
  canSubmitDrunkScale: () => boolean;
  setProfilePicture: (uri: string) => void;
  setUserName: (firstName: string, lastName: string) => void;
  generateUserId: (firstName: string, lastName: string) => string;
  completeOnboarding: (firstName: string, lastName: string) => Promise<void>;
  addFriend: (friendUserId: string) => Promise<boolean>;
  removeFriend: (friendUserId: string) => void;
  searchUser: (userId: string) => Promise<Friend | null>;
  sendFriendRequest: (friendUserId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  declineFriendRequest: (requestId: string) => Promise<boolean>;
  loadFriendRequests: () => Promise<void>;
  resetProfile: () => void;
  resetStats: () => void;
  syncToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  awardXP: (type: XPActivity['type'], description: string, venueId?: string) => void;
  getAllRanks: () => RankInfo[];
  getXPForNextRank: () => number;
  getProgressToNextRank: () => number;
  updateDailyTrackerTotals: (stats: { shots: number; scoopAndScores: number; beers: number; beerTowers: number; funnels: number; shotguns: number; poolGamesWon: number; dartGamesWon: number; }) => void;
  getDailyStats: () => DailyStats;
  resetDailyStats: () => void;
  recordVenueSpecificActivity: (venueId: string, activityType: 'pool_win' | 'dart_win' | 'group_shot') => void;
  checkTrifectaAchievement: () => boolean;
}

const XP_VALUES = {
  visit_new_bar: 25,
  participate_event: 50,
  bring_friend: 30,
  complete_night_out: 100,
  special_achievement: 75,
  live_music: 40,
  featured_drink: 20,
  bar_game: 35,
  photo_taken: 10,
  shots: 5,
  scoop_and_scores: 4,
  beers: 2,
  beer_towers: 5,
  funnels: 3,
  shotguns: 3,
  pool_games_won: 7,
  dart_games_won: 7,
};

const RANK_STRUCTURE: RankInfo[] = [
  // Sober Star (0-500)
  { tier: 1, subRank: 1, title: 'Sober Star', subTitle: 'Newcomer', color: '#4CAF50', minXP: 0, maxXP: 125 },
  { tier: 1, subRank: 2, title: 'Sober Star', subTitle: 'Explorer', color: '#4CAF50', minXP: 126, maxXP: 250 },
  { tier: 1, subRank: 3, title: 'Sober Star', subTitle: 'Enthusiast', color: '#4CAF50', minXP: 251, maxXP: 375 },
  { tier: 1, subRank: 4, title: 'Sober Star', subTitle: 'Rising Star', color: '#4CAF50', minXP: 376, maxXP: 500 },
  
  // Buzzed Beginner (501-1000)
  { tier: 2, subRank: 1, title: 'Buzzed Beginner', subTitle: 'Novice', color: '#FFC107', minXP: 501, maxXP: 625 },
  { tier: 2, subRank: 2, title: 'Buzzed Beginner', subTitle: 'Adventurer', color: '#FFC107', minXP: 626, maxXP: 750 },
  { tier: 2, subRank: 3, title: 'Buzzed Beginner', subTitle: 'Socializer', color: '#FFC107', minXP: 751, maxXP: 875 },
  { tier: 2, subRank: 4, title: 'Buzzed Beginner', subTitle: 'Party Starter', color: '#FFC107', minXP: 876, maxXP: 1000 },
  
  // Tipsy Talent (1001-1500)
  { tier: 3, subRank: 1, title: 'Tipsy Talent', subTitle: 'Local Hero', color: '#FF9800', minXP: 1001, maxXP: 1125 },
  { tier: 3, subRank: 2, title: 'Tipsy Talent', subTitle: 'Crowd Pleaser', color: '#FF9800', minXP: 1126, maxXP: 1250 },
  { tier: 3, subRank: 3, title: 'Tipsy Talent', subTitle: 'Nightlife Navigator', color: '#FF9800', minXP: 1251, maxXP: 1375 },
  { tier: 3, subRank: 4, title: 'Tipsy Talent', subTitle: 'Star of the Scene', color: '#FF9800', minXP: 1376, maxXP: 1500 },
  
  // Big Chocolate (1501-2000)
  { tier: 4, subRank: 1, title: 'Big Chocolate', subTitle: 'Legend', color: '#FF5722', minXP: 1501, maxXP: 1625 },
  { tier: 4, subRank: 2, title: 'Big Chocolate', subTitle: 'Icon', color: '#FF5722', minXP: 1626, maxXP: 1750 },
  { tier: 4, subRank: 3, title: 'Big Chocolate', subTitle: 'Elite', color: '#FF5722', minXP: 1751, maxXP: 1875 },
  { tier: 4, subRank: 4, title: 'Big Chocolate', subTitle: 'Master of the Night', color: '#FF5722', minXP: 1876, maxXP: 2000 },
  
  // Scoop & Score Champ (2001-2500)
  { tier: 5, subRank: 1, title: 'Scoop & Score Champ', subTitle: 'Champion', color: '#9C27B0', minXP: 2001, maxXP: 2125 },
  { tier: 5, subRank: 2, title: 'Scoop & Score Champ', subTitle: 'MVP', color: '#9C27B0', minXP: 2126, maxXP: 2250 },
  { tier: 5, subRank: 3, title: 'Scoop & Score Champ', subTitle: 'Hall of Famer', color: '#9C27B0', minXP: 2251, maxXP: 2375 },
  { tier: 5, subRank: 4, title: 'Scoop & Score Champ', subTitle: 'Ultimate Legend', color: '#9C27B0', minXP: 2376, maxXP: 2500 },
];

const RESET_HOUR = 5;

const shouldResetDaily = (lastReset: string): boolean => {
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

const defaultDailyStats: DailyStats = {
  shots: 0,
  scoopAndScores: 0,
  beers: 0,
  beerTowers: 0,
  funnels: 0,
  shotguns: 0,
  poolGamesWon: 0,
  dartGamesWon: 0,
  lastReset: new Date().toISOString(),
};

const defaultProfile: UserProfile = {
  firstName: 'Bar',
  lastName: 'Buddy',
  email: 'user@barbuddy.com',
  joinDate: new Date().toISOString(),
  nightsOut: 0,
  barsHit: 0,
  drunkScaleRatings: [],
  userId: 'default',
  hasCustomizedProfile: false,
  hasCompletedOnboarding: false,
  friends: [],
  friendRequests: [],
  xp: 0,
  xpActivities: [],
  visitedBars: [],
  eventsAttended: 0,
  friendsReferred: 0,
  liveEventsAttended: 0,
  featuredDrinksTried: 0,
  barGamesPlayed: 0,
  photosTaken: 0,
  totalShots: 0,
  totalScoopAndScores: 0,
  totalBeers: 0,
  totalBeerTowers: 0,
  totalFunnels: 0,
  totalShotguns: 0,
  totalPoolGamesWon: 0,
  totalDartGamesWon: 0,
  dailyStats: defaultDailyStats,
  venueSpecificActivities: [],
};

const getRankByXP = (xp: number): RankInfo => {
  // Ensure xp is a valid number and prevent infinite loops
  const validXP = (typeof xp === 'number' && !isNaN(xp) && isFinite(xp)) ? Math.max(0, xp) : 0;
  
  try {
    for (let i = RANK_STRUCTURE.length - 1; i >= 0; i--) {
      if (validXP >= RANK_STRUCTURE[i].minXP) {
        return RANK_STRUCTURE[i];
      }
    }
    return RANK_STRUCTURE[0];
  } catch (error) {
    console.warn('Error getting rank by XP:', error);
    return RANK_STRUCTURE[0];
  }
};

const isSameDay = (date1: string, date2: string): boolean => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  } catch {
    return false;
  }
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      isLoading: false,
      
      updateProfile: (updates) => {
        try {
          set((state) => ({
            profile: { 
              ...state.profile, 
              ...updates,
              hasCustomizedProfile: true
            }
          }));
          get().syncToSupabase().catch(err => console.warn('Sync error:', err));
        } catch (error) {
          console.warn('Error updating profile:', error);
        }
      },
      
      incrementNightsOut: () => {
        try {
          const today = new Date().toISOString();
          const { profile } = get();
          
          if (!profile.lastNightOutDate || !isSameDay(profile.lastNightOutDate, today)) {
            set((state) => ({
              profile: {
                ...state.profile,
                nightsOut: (state.profile.nightsOut || 0) + 1,
                lastNightOutDate: today
              }
            }));
            
            // Check if this completes a night out (3+ bars)
            if ((profile.barsHit || 0) >= 3) {
              get().awardXP('complete_night_out', 'Completed a night out with 3+ bars');
            }
            
            get().syncToSupabase().catch(err => console.warn('Sync error:', err));
          }
        } catch (error) {
          console.warn('Error incrementing nights out:', error);
        }
      },
      
      incrementBarsHit: () => {
        try {
          set((state) => ({
            profile: {
              ...state.profile,
              barsHit: (state.profile.barsHit || 0) + 1
            }
          }));
          get().syncToSupabase().catch(err => console.warn('Sync error:', err));
        } catch (error) {
          console.warn('Error incrementing bars hit:', error);
        }
      },
      
      addDrunkScaleRating: (rating) => {
        try {
          // Ensure rating is a valid number
          const validRating = (typeof rating === 'number' && !isNaN(rating) && isFinite(rating)) ? Math.max(0, Math.min(10, rating)) : 0;
          const today = new Date().toISOString();
          
          set((state) => ({
            profile: {
              ...state.profile,
              drunkScaleRatings: [...(state.profile.drunkScaleRatings || []), validRating],
              lastDrunkScaleDate: today
            }
          }));
          get().syncToSupabase().catch(err => console.warn('Sync error:', err));
        } catch (error) {
          console.warn('Error adding drunk scale rating:', error);
        }
      },
      
      getAverageDrunkScale: () => {
        try {
          const { drunkScaleRatings } = get().profile;
          if (!drunkScaleRatings || drunkScaleRatings.length === 0) return 0;
          
          // Filter out any invalid ratings
          const validRatings = drunkScaleRatings.filter(rating => 
            typeof rating === 'number' && !isNaN(rating) && isFinite(rating) && rating > 0
          );
          
          if (validRatings.length === 0) return 0;
          
          const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
          const average = sum / validRatings.length;
          
          // Ensure the result is a valid number
          return (typeof average === 'number' && !isNaN(average) && isFinite(average)) ? Math.round(average * 10) / 10 : 0;
        } catch (error) {
          console.warn('Error calculating average drunk scale:', error);
          return 0;
        }
      },
      
      getRank: () => {
        try {
          const { xp } = get().profile;
          return getRankByXP(xp || 0);
        } catch (error) {
          console.warn('Error getting rank:', error);
          return RANK_STRUCTURE[0];
        }
      },
      
      getAllRanks: () => {
        return RANK_STRUCTURE;
      },
      
      getXPForNextRank: () => {
        try {
          const currentRank = get().getRank();
          const currentRankIndex = RANK_STRUCTURE.findIndex(rank => 
            rank.tier === currentRank.tier && rank.subRank === currentRank.subRank
          );
          
          if (currentRankIndex >= 0 && currentRankIndex < RANK_STRUCTURE.length - 1) {
            return RANK_STRUCTURE[currentRankIndex + 1].minXP;
          }
          
          return currentRank.maxXP;
        } catch (error) {
          console.warn('Error getting XP for next rank:', error);
          return RANK_STRUCTURE[0].maxXP;
        }
      },
      
      getProgressToNextRank: () => {
        try {
          const { xp } = get().profile;
          const validXP = (typeof xp === 'number' && !isNaN(xp) && isFinite(xp)) ? Math.max(0, xp) : 0;
          const currentRank = get().getRank();
          const nextRankXP = get().getXPForNextRank();
          
          if (nextRankXP === currentRank.maxXP) return 100; // Max rank
          
          const progress = ((validXP - currentRank.minXP) / (nextRankXP - currentRank.minXP)) * 100;
          const validProgress = (typeof progress === 'number' && !isNaN(progress) && isFinite(progress)) ? progress : 0;
          
          return Math.min(Math.max(validProgress, 0), 100);
        } catch (error) {
          console.warn('Error calculating progress to next rank:', error);
          return 0;
        }
      },
      
      awardXP: (type, description, venueId) => {
        try {
          const xpAmount = XP_VALUES[type] || 0;
          
          // Ensure xpAmount is a valid number
          if (typeof xpAmount !== 'number' || isNaN(xpAmount) || !isFinite(xpAmount)) {
            console.warn('Invalid XP amount for type:', type);
            return;
          }
          
          const activityId = Math.random().toString(36).substr(2, 9);
          
          set((state) => {
            const currentXP = (typeof state.profile.xp === 'number' && !isNaN(state.profile.xp) && isFinite(state.profile.xp)) ? state.profile.xp : 0;
            
            const newActivity: XPActivity = {
              id: activityId,
              type,
              xpAwarded: xpAmount,
              timestamp: new Date().toISOString(),
              description,
            };
            
            let updatedProfile = {
              ...state.profile,
              xp: currentXP + xpAmount,
              xpActivities: [...(state.profile.xpActivities || []), newActivity],
            };
            
            // Update specific counters safely
            switch (type) {
              case 'visit_new_bar':
                if (venueId && !(state.profile.visitedBars || []).includes(venueId)) {
                  updatedProfile.visitedBars = [...(state.profile.visitedBars || []), venueId];
                }
                break;
              case 'participate_event':
                updatedProfile.eventsAttended = (state.profile.eventsAttended || 0) + 1;
                break;
              case 'bring_friend':
                updatedProfile.friendsReferred = (state.profile.friendsReferred || 0) + 1;
                break;
              case 'live_music':
                updatedProfile.liveEventsAttended = (state.profile.liveEventsAttended || 0) + 1;
                break;
              case 'featured_drink':
                updatedProfile.featuredDrinksTried = (state.profile.featuredDrinksTried || 0) + 1;
                break;
              case 'bar_game':
                updatedProfile.barGamesPlayed = (state.profile.barGamesPlayed || 0) + 1;
                break;
              case 'photo_taken':
                updatedProfile.photosTaken = (state.profile.photosTaken || 0) + 1;
                break;
              case 'pool_games_won':
                updatedProfile.barGamesPlayed = (state.profile.barGamesPlayed || 0) + 1;
                break;
              case 'dart_games_won':
                updatedProfile.barGamesPlayed = (state.profile.barGamesPlayed || 0) + 1;
                break;
            }
            
            return { profile: updatedProfile };
          });
          
          get().syncToSupabase().catch(err => console.warn('Sync error:', err));
        } catch (error) {
          console.warn('Error awarding XP:', error);
        }
      },
      
      updateDailyTrackerTotals: (stats) => {
        try {
          set((state) => {
            // Reset daily stats if needed
            let dailyStats = state.profile.dailyStats;
            if (shouldResetDaily(dailyStats.lastReset)) {
              dailyStats = { ...defaultDailyStats, lastReset: new Date().toISOString() };
            }

            return {
              profile: {
                ...state.profile,
                totalShots: (state.profile.totalShots || 0) + (stats.shots || 0),
                totalScoopAndScores: (state.profile.totalScoopAndScores || 0) + (stats.scoopAndScores || 0),
                totalBeers: (state.profile.totalBeers || 0) + (stats.beers || 0),
                totalBeerTowers: (state.profile.totalBeerTowers || 0) + (stats.beerTowers || 0),
                totalFunnels: (state.profile.totalFunnels || 0) + (stats.funnels || 0),
                totalShotguns: (state.profile.totalShotguns || 0) + (stats.shotguns || 0),
                totalPoolGamesWon: (state.profile.totalPoolGamesWon || 0) + (stats.poolGamesWon || 0),
                totalDartGamesWon: (state.profile.totalDartGamesWon || 0) + (stats.dartGamesWon || 0),
                dailyStats: {
                  ...dailyStats,
                  shots: stats.shots || 0,
                  scoopAndScores: stats.scoopAndScores || 0,
                  beers: stats.beers || 0,
                  beerTowers: stats.beerTowers || 0,
                  funnels: stats.funnels || 0,
                  shotguns: stats.shotguns || 0,
                  poolGamesWon: stats.poolGamesWon || 0,
                  dartGamesWon: stats.dartGamesWon || 0,
                }
              }
            };
          });
          get().syncToSupabase().catch(err => console.warn('Sync error:', err));
        } catch (error) {
          console.warn('Error updating daily tracker totals:', error);
        }
      },

      getDailyStats: () => {
        try {
          const { profile } = get();
          let dailyStats = profile.dailyStats || defaultDailyStats;
          
          // Reset if needed
          if (shouldResetDaily(dailyStats.lastReset)) {
            dailyStats = { ...defaultDailyStats, lastReset: new Date().toISOString() };
            // Update the store with reset stats
            set((state) => ({
              profile: {
                ...state.profile,
                dailyStats
              }
            }));
          }
          
          return dailyStats;
        } catch (error) {
          console.warn('Error getting daily stats:', error);
          return defaultDailyStats;
        }
      },

      resetDailyStats: () => {
        try {
          set((state) => ({
            profile: {
              ...state.profile,
              dailyStats: { ...defaultDailyStats, lastReset: new Date().toISOString() }
            }
          }));
        } catch (error) {
          console.warn('Error resetting daily stats:', error);
        }
      },

      recordVenueSpecificActivity: (venueId: string, activityType: 'pool_win' | 'dart_win' | 'group_shot') => {
        try {
          const activity: VenueSpecificActivity = {
            venueId,
            activityType,
            timestamp: new Date().toISOString(),
          };

          set((state) => ({
            profile: {
              ...state.profile,
              venueSpecificActivities: [...(state.profile.venueSpecificActivities || []), activity]
            }
          }));

          // Check for Trifecta achievement
          if (get().checkTrifectaAchievement()) {
            // Award Trifecta achievement through achievement store
            const achievementStore = (window as any).__achievementStore;
            if (achievementStore?.getState) {
              const { completeAchievement } = achievementStore.getState();
              completeAchievement('trifecta');
            }
            
            // Award special XP
            get().awardXP('special_achievement', 'Completed the Trifecta achievement!');
          }

          get().syncToSupabase().catch(err => console.warn('Sync error:', err));
        } catch (error) {
          console.warn('Error recording venue specific activity:', error);
        }
      },

      checkTrifectaAchievement: () => {
        try {
          const { venueSpecificActivities } = get().profile;
          
          // Check for pool win at JBA (venue ID '6')
          const poolAtJBA = venueSpecificActivities.some(a => 
            a.venueId === '6' && a.activityType === 'pool_win'
          );
          
          // Check for dart win at The Bird (venue ID '4')
          const dartAtBird = venueSpecificActivities.some(a => 
            a.venueId === '4' && a.activityType === 'dart_win'
          );
          
          // Check for group shot at Late Nite (venue ID '5')
          const groupShotAtLateNite = venueSpecificActivities.some(a => 
            a.venueId === '5' && a.activityType === 'group_shot'
          );
          
          return poolAtJBA && dartAtBird && groupShotAtLateNite;
        } catch (error) {
          console.warn('Error checking Trifecta achievement:', error);
          return false;
        }
      },
      
      canIncrementNightsOut: () => {
        try {
          const today = new Date().toISOString();
          const { profile } = get();
          return !profile.lastNightOutDate || !isSameDay(profile.lastNightOutDate, today);
        } catch {
          return true;
        }
      },

      canSubmitDrunkScale: () => {
        try {
          const today = new Date().toISOString();
          const { profile } = get();
          return !profile.lastDrunkScaleDate || !isSameDay(profile.lastDrunkScaleDate, today);
        } catch {
          return true;
        }
      },

      setProfilePicture: (uri: string) => {
        try {
          set((state) => ({
            profile: {
              ...state.profile,
              profilePicture: uri,
              hasCustomizedProfile: true
            }
          }));
          get().syncToSupabase().catch(err => console.warn('Sync error:', err));
        } catch (error) {
          console.warn('Error setting profile picture:', error);
        }
      },

      setUserName: (firstName: string, lastName: string) => {
        try {
          set((state) => ({
            profile: {
              ...state.profile,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              hasCustomizedProfile: true
            }
          }));
          get().syncToSupabase().catch(err => console.warn('Sync error:', err));
        } catch (error) {
          console.warn('Error setting user name:', error);
        }
      },

      generateUserId: (firstName: string, lastName: string) => {
        try {
          const cleanName = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, '');
          const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
          return `#${cleanName}${randomDigits}`;
        } catch (error) {
          console.warn('Error generating user ID:', error);
          return '#DefaultUser12345';
        }
      },

      completeOnboarding: async (firstName: string, lastName: string) => {
        try {
          const userId = get().generateUserId(firstName, lastName);
          
          set((state) => ({
            profile: {
              ...state.profile,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              userId,
              hasCompletedOnboarding: true,
              hasCustomizedProfile: true
            }
          }));

          // Award XP for joining
          get().awardXP('special_achievement', 'Welcome to BarBuddy!');

          await get().syncToSupabase();
        } catch (error) {
          console.warn('Error completing onboarding:', error);
          throw error;
        }
      },

      addFriend: async (friendUserId: string) => {
        try {
          const friend = await get().searchUser(friendUserId);
          if (!friend) return false;

          const { profile } = get();
          if ((profile.friends || []).some(f => f.userId === friendUserId)) {
            return false;
          }

          set((state) => ({
            profile: {
              ...state.profile,
              friends: [...(state.profile.friends || []), friend]
            }
          }));

          // Award XP for bringing a friend
          get().awardXP('bring_friend', `Added ${friend.name} as a friend`);

          return true;
        } catch (error) {
          console.warn('Error adding friend:', error);
          return false;
        }
      },

      removeFriend: async (friendUserId: string) => {
        try {
          set((state) => ({
            profile: {
              ...state.profile,
              friends: (state.profile.friends || []).filter(f => f.userId !== friendUserId)
            }
          }));
        } catch (error) {
          console.warn('Error removing friend:', error);
        }
      },

      searchUser: async (userId: string) => {
        try {
          if (userId.startsWith('#')) {
            return {
              userId,
              name: 'Test User',
              nightsOut: Math.floor(Math.random() * 20),
              barsHit: Math.floor(Math.random() * 50),
              rankTitle: 'Tipsy Talent',
              addedAt: new Date().toISOString(),
              xp: Math.floor(Math.random() * 1500),
            };
          }
          return null;
        } catch (error) {
          console.warn('Error searching user:', error);
          return null;
        }
      },

      sendFriendRequest: async (friendUserId: string) => {
        try {
          return true;
        } catch (error) {
          console.warn('Error sending friend request:', error);
          return false;
        }
      },

      acceptFriendRequest: async (requestId: string) => {
        try {
          return true;
        } catch (error) {
          console.warn('Error accepting friend request:', error);
          return false;
        }
      },

      declineFriendRequest: async (requestId: string) => {
        try {
          return true;
        } catch (error) {
          console.warn('Error declining friend request:', error);
          return false;
        }
      },

      loadFriendRequests: async () => {
        try {
          // Mock implementation
        } catch (error) {
          console.warn('Error loading friend requests:', error);
        }
      },

      resetProfile: () => {
        try {
          const { profile } = get();
          if (!profile.hasCustomizedProfile) {
            set({ profile: defaultProfile });
          }
        } catch (error) {
          console.warn('Error resetting profile:', error);
        }
      },

      resetStats: async () => {
        try {
          set((state) => ({
            profile: {
              ...state.profile,
              nightsOut: 0,
              barsHit: 0,
              drunkScaleRatings: [],
              lastNightOutDate: undefined,
              lastDrunkScaleDate: undefined,
              xp: 0,
              xpActivities: [],
              visitedBars: [],
              eventsAttended: 0,
              friendsReferred: 0,
              liveEventsAttended: 0,
              featuredDrinksTried: 0,
              barGamesPlayed: 0,
              photosTaken: 0,
              totalShots: 0,
              totalScoopAndScores: 0,
              totalBeers: 0,
              totalBeerTowers: 0,
              totalFunnels: 0,
              totalShotguns: 0,
              totalPoolGamesWon: 0,
              totalDartGamesWon: 0,
              dailyStats: defaultDailyStats,
              venueSpecificActivities: [],
            }
          }));
          await get().syncToSupabase();
        } catch (error) {
          console.warn('Error resetting stats:', error);
        }
      },

      syncToSupabase: async () => {
        try {
          // Mock implementation - would sync to Supabase in real app
          return Promise.resolve();
        } catch (error) {
          console.warn('Error syncing to Supabase:', error);
          return Promise.resolve();
        }
      },

      loadFromSupabase: async () => {
        try {
          // Mock implementation - would load from Supabase in real app
          return Promise.resolve();
        } catch (error) {
          console.warn('Error loading from Supabase:', error);
          return Promise.resolve();
        }
      }
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure profile has all required fields after rehydration
        if (state?.profile) {
          state.profile = {
            ...defaultProfile,
            ...state.profile,
            // Ensure numeric fields are valid numbers
            xp: (typeof state.profile.xp === 'number' && !isNaN(state.profile.xp) && isFinite(state.profile.xp)) ? state.profile.xp : 0,
            nightsOut: (typeof state.profile.nightsOut === 'number' && !isNaN(state.profile.nightsOut) && isFinite(state.profile.nightsOut)) ? state.profile.nightsOut : 0,
            barsHit: (typeof state.profile.barsHit === 'number' && !isNaN(state.profile.barsHit) && isFinite(state.profile.barsHit)) ? state.profile.barsHit : 0,
            // Ensure arrays are valid
            drunkScaleRatings: Array.isArray(state.profile.drunkScaleRatings) ? state.profile.drunkScaleRatings.filter(r => typeof r === 'number' && !isNaN(r) && isFinite(r)) : [],
            xpActivities: Array.isArray(state.profile.xpActivities) ? state.profile.xpActivities : [],
            visitedBars: Array.isArray(state.profile.visitedBars) ? state.profile.visitedBars : [],
            friends: Array.isArray(state.profile.friends) ? state.profile.friends : [],
            friendRequests: Array.isArray(state.profile.friendRequests) ? state.profile.friendRequests : [],
            venueSpecificActivities: Array.isArray(state.profile.venueSpecificActivities) ? state.profile.venueSpecificActivities : [],
            // Ensure dailyStats exists
            dailyStats: state.profile.dailyStats || defaultDailyStats,
          };
        }
      },
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__userProfileStore = useUserProfileStore;
}