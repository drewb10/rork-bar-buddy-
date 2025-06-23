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
  type: 'visit_new_bar' | 'participate_event' | 'bring_friend' | 'complete_night_out' | 'special_achievement' | 'live_music' | 'featured_drink' | 'bar_game' | 'photo_taken' | 'shots' | 'scoop_and_scores' | 'beers' | 'beer_towers' | 'funnels' | 'shotguns' | 'pool_games' | 'dart_games';
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
  date: string;
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
  poolGamesWon: number;
  dartGamesWon: number;
  dailyStats?: DailyStats;
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
  resetStats: () => Promise<void>;
  syncToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  awardXP: (type: XPActivity['type'], description: string, venueId?: string) => void;
  getAllRanks: () => RankInfo[];
  getXPForNextRank: () => number;
  getProgressToNextRank: () => number;
  updateDailyTrackerTotals: (stats: { shots: number; scoopAndScores: number; beers: number; beerTowers: number; funnels: number; shotguns: number; poolGamesWon: number; dartGamesWon: number; }) => void;
  updateAchievementProgress: () => void;
  getDailyStats: () => DailyStats;
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
  pool_games: 10,
  dart_games: 10,
};

const RANK_STRUCTURE: RankInfo[] = [
  { tier: 1, subRank: 1, title: 'Sober Star', subTitle: 'Newcomer', color: '#4CAF50', minXP: 0, maxXP: 125 },
  { tier: 1, subRank: 2, title: 'Sober Star', subTitle: 'Explorer', color: '#4CAF50', minXP: 126, maxXP: 250 },
  { tier: 1, subRank: 3, title: 'Sober Star', subTitle: 'Enthusiast', color: '#4CAF50', minXP: 251, maxXP: 375 },
  { tier: 1, subRank: 4, title: 'Sober Star', subTitle: 'Rising Star', color: '#4CAF50', minXP: 376, maxXP: 500 },
  { tier: 2, subRank: 1, title: 'Buzzed Beginner', subTitle: 'Novice', color: '#FFC107', minXP: 501, maxXP: 625 },
  { tier: 2, subRank: 2, title: 'Buzzed Beginner', subTitle: 'Adventurer', color: '#FFC107', minXP: 626, maxXP: 750 },
  { tier: 2, subRank: 3, title: 'Buzzed Beginner', subTitle: 'Socializer', color: '#FFC107', minXP: 751, maxXP: 875 },
  { tier: 2, subRank: 4, title: 'Buzzed Beginner', subTitle: 'Party Starter', color: '#FFC107', minXP: 876, maxXP: 1000 },
  { tier: 3, subRank: 1, title: 'Tipsy Talent', subTitle: 'Local Hero', color: '#FF9800', minXP: 1001, maxXP: 1125 },
  { tier: 3, subRank: 2, title: 'Tipsy Talent', subTitle: 'Crowd Pleaser', color: '#FF9800', minXP: 1126, maxXP: 1250 },
  { tier: 3, subRank: 3, title: 'Tipsy Talent', subTitle: 'Nightlife Navigator', color: '#FF9800', minXP: 1251, maxXP: 1375 },
  { tier: 3, subRank: 4, title: 'Tipsy Talent', subTitle: 'Star of the Scene', color: '#FF9800', minXP: 1376, maxXP: 1500 },
  { tier: 4, subRank: 1, title: 'Big Chocolate', subTitle: 'Legend', color: '#FF5722', minXP: 1501, maxXP: 1625 },
  { tier: 4, subRank: 2, title: 'Big Chocolate', subTitle: 'Icon', color: '#FF5722', minXP: 1626, maxXP: 1750 },
  { tier: 4, subRank: 3, title: 'Big Chocolate', subTitle: 'Elite', color: '#FF5722', minXP: 1751, maxXP: 1875 },
  { tier: 4, subRank: 4, title: 'Big Chocolate', subTitle: 'Master of the Night', color: '#FF5722', minXP: 1876, maxXP: 2000 },
  { tier: 5, subRank: 1, title: 'Scoop & Score Champ', subTitle: 'Champion', color: '#9C27B0', minXP: 2001, maxXP: 2125 },
  { tier: 5, subRank: 2, title: 'Scoop & Score Champ', subTitle: 'MVP', color: '#9C27B0', minXP: 2126, maxXP: 2250 },
  { tier: 5, subRank: 3, title: 'Scoop & Score Champ', subTitle: 'Hall of Famer', color: '#9C27B0', minXP: 2251, maxXP: 2375 },
  { tier: 5, subRank: 4, title: 'Scoop & Score Champ', subTitle: 'Ultimate Legend', color: '#9C27B0', minXP: 2376, maxXP: 2500 },
];

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
  poolGamesWon: 0,
  dartGamesWon: 0,
};

const getRankByXP = (xp: number): RankInfo => {
  for (let i = RANK_STRUCTURE.length - 1; i >= 0; i--) {
    if (xp >= RANK_STRUCTURE[i].minXP) {
      return RANK_STRUCTURE[i];
    }
  }
  return RANK_STRUCTURE[0];
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

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      isLoading: false,
      
      updateProfile: (updates) => {
        set((state) => ({
          profile: { 
            ...state.profile, 
            ...updates,
            hasCustomizedProfile: true
          }
        }));
        get().syncToSupabase();
      },
      
      incrementNightsOut: () => {
        try {
          const today = new Date().toISOString();
          const { profile } = get();
          
          if (!profile.lastNightOutDate || !isSameDay(profile.lastNightOutDate, today)) {
            set((state) => ({
              profile: {
                ...state.profile,
                nightsOut: state.profile.nightsOut + 1,
                lastNightOutDate: today
              }
            }));
            
            if (profile.barsHit >= 3) {
              get().awardXP('complete_night_out', 'Completed a night out with 3+ bars');
            }
            
            get().updateAchievementProgress();
            get().syncToSupabase();
          }
        } catch (error) {
          console.warn('Error incrementing nights out:', error);
        }
      },
      
      incrementBarsHit: () => {
        set((state) => ({
          profile: {
            ...state.profile,
            barsHit: state.profile.barsHit + 1
          }
        }));
        get().updateAchievementProgress();
        get().syncToSupabase();
      },
      
      addDrunkScaleRating: (rating) => {
        try {
          const today = new Date().toISOString();
          
          set((state) => ({
            profile: {
              ...state.profile,
              drunkScaleRatings: [...state.profile.drunkScaleRatings, rating],
              lastDrunkScaleDate: today
            }
          }));
          get().syncToSupabase();
        } catch (error) {
          console.warn('Error adding drunk scale rating:', error);
        }
      },
      
      getAverageDrunkScale: () => {
        try {
          const { drunkScaleRatings } = get().profile;
          if (drunkScaleRatings.length === 0) return 0;
          const sum = drunkScaleRatings.reduce((acc, rating) => acc + rating, 0);
          return Math.round((sum / drunkScaleRatings.length) * 10) / 10;
        } catch {
          return 0;
        }
      },
      
      getRank: () => {
        try {
          const { xp } = get().profile;
          return getRankByXP(xp);
        } catch {
          return RANK_STRUCTURE[0];
        }
      },
      
      getAllRanks: () => {
        return RANK_STRUCTURE;
      },
      
      getXPForNextRank: () => {
        const currentRank = get().getRank();
        const currentRankIndex = RANK_STRUCTURE.findIndex(rank => 
          rank.tier === currentRank.tier && rank.subRank === currentRank.subRank
        );
        
        if (currentRankIndex < RANK_STRUCTURE.length - 1) {
          return RANK_STRUCTURE[currentRankIndex + 1].minXP;
        }
        
        return currentRank.maxXP;
      },
      
      getProgressToNextRank: () => {
        const { xp } = get().profile;
        const currentRank = get().getRank();
        const nextRankXP = get().getXPForNextRank();
        
        if (nextRankXP === currentRank.maxXP) return 100;
        
        const progress = ((xp - currentRank.minXP) / (nextRankXP - currentRank.minXP)) * 100;
        return Math.min(Math.max(progress, 0), 100);
      },
      
      awardXP: (type, description, venueId) => {
        const xpAmount = XP_VALUES[type];
        const activityId = Math.random().toString(36).substr(2, 9);
        
        set((state) => {
          const newActivity: XPActivity = {
            id: activityId,
            type,
            xpAwarded: xpAmount,
            timestamp: new Date().toISOString(),
            description,
          };
          
          let updatedProfile = {
            ...state.profile,
            xp: state.profile.xp + xpAmount,
            xpActivities: [...state.profile.xpActivities, newActivity],
          };
          
          switch (type) {
            case 'visit_new_bar':
              if (venueId && !state.profile.visitedBars.includes(venueId)) {
                updatedProfile.visitedBars = [...state.profile.visitedBars, venueId];
              }
              break;
            case 'participate_event':
              updatedProfile.eventsAttended = state.profile.eventsAttended + 1;
              break;
            case 'bring_friend':
              updatedProfile.friendsReferred = state.profile.friendsReferred + 1;
              break;
            case 'live_music':
              updatedProfile.liveEventsAttended = state.profile.liveEventsAttended + 1;
              break;
            case 'featured_drink':
              updatedProfile.featuredDrinksTried = state.profile.featuredDrinksTried + 1;
              break;
            case 'bar_game':
              updatedProfile.barGamesPlayed = state.profile.barGamesPlayed + 1;
              break;
            case 'photo_taken':
              updatedProfile.photosTaken = state.profile.photosTaken + 1;
              break;
            case 'pool_games':
              updatedProfile.poolGamesWon = state.profile.poolGamesWon + 1;
              break;
            case 'dart_games':
              updatedProfile.dartGamesWon = state.profile.dartGamesWon + 1;
              break;
          }
          
          return { profile: updatedProfile };
        });
        
        get().updateAchievementProgress();
        get().syncToSupabase();
      },
      
      updateDailyTrackerTotals: (stats) => {
        const today = getTodayString();
        
        set((state) => {
          const currentDailyStats = state.profile.dailyStats;
          const isToday = currentDailyStats?.date === today;
          
          // Calculate the differences to avoid double counting
          const shotsDiff = Math.max(0, stats.shots - (isToday ? currentDailyStats.shots : 0));
          const scoopDiff = Math.max(0, stats.scoopAndScores - (isToday ? currentDailyStats.scoopAndScores : 0));
          const beersDiff = Math.max(0, stats.beers - (isToday ? currentDailyStats.beers : 0));
          const beerTowersDiff = Math.max(0, stats.beerTowers - (isToday ? currentDailyStats.beerTowers : 0));
          const funnelsDiff = Math.max(0, stats.funnels - (isToday ? currentDailyStats.funnels : 0));
          const shotgunsDiff = Math.max(0, stats.shotguns - (isToday ? currentDailyStats.shotguns : 0));
          const poolDiff = Math.max(0, stats.poolGamesWon - (isToday ? currentDailyStats.poolGamesWon : 0));
          const dartDiff = Math.max(0, stats.dartGamesWon - (isToday ? currentDailyStats.dartGamesWon : 0));
          
          const newDailyStats: DailyStats = {
            shots: stats.shots,
            scoopAndScores: stats.scoopAndScores,
            beers: stats.beers,
            beerTowers: stats.beerTowers,
            funnels: stats.funnels,
            shotguns: stats.shotguns,
            poolGamesWon: stats.poolGamesWon,
            dartGamesWon: stats.dartGamesWon,
            date: today,
          };
          
          return {
            profile: {
              ...state.profile,
              totalShots: state.profile.totalShots + shotsDiff,
              totalScoopAndScores: state.profile.totalScoopAndScores + scoopDiff,
              totalBeers: state.profile.totalBeers + beersDiff,
              totalBeerTowers: state.profile.totalBeerTowers + beerTowersDiff,
              totalFunnels: state.profile.totalFunnels + funnelsDiff,
              totalShotguns: state.profile.totalShotguns + shotgunsDiff,
              poolGamesWon: state.profile.poolGamesWon + poolDiff,
              dartGamesWon: state.profile.dartGamesWon + dartDiff,
              dailyStats: newDailyStats,
            }
          };
        });
        
        get().updateAchievementProgress();
        get().syncToSupabase();
      },

      getDailyStats: () => {
        const { profile } = get();
        const today = getTodayString();
        
        if (profile.dailyStats?.date === today) {
          return profile.dailyStats;
        }
        
        return {
          shots: 0,
          scoopAndScores: 0,
          beers: 0,
          beerTowers: 0,
          funnels: 0,
          shotguns: 0,
          poolGamesWon: 0,
          dartGamesWon: 0,
          date: today,
        };
      },

      updateAchievementProgress: () => {
        const { profile } = get();
        
        if (typeof window !== 'undefined' && (window as any).__achievementStore) {
          const achievementStore = (window as any).__achievementStore.getState();
          
          achievementStore.updateAchievementProgress('bars-visited', profile.barsHit);
          achievementStore.updateAchievementProgress('nights-out', profile.nightsOut);
          achievementStore.updateAchievementProgress('beers', profile.totalBeers);
          achievementStore.updateAchievementProgress('shots', profile.totalShots);
          achievementStore.updateAchievementProgress('beer-towers', profile.totalBeerTowers);
          achievementStore.updateAchievementProgress('scoop-and-scores', profile.totalScoopAndScores);
          achievementStore.updateAchievementProgress('funnels', profile.totalFunnels);
          achievementStore.updateAchievementProgress('shotguns', profile.totalShotguns);
          achievementStore.updateAchievementProgress('pool-games', profile.poolGamesWon);
          achievementStore.updateAchievementProgress('dart-games', profile.dartGamesWon);
          achievementStore.updateAchievementProgress('photos-taken', profile.photosTaken);
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
        set((state) => ({
          profile: {
            ...state.profile,
            profilePicture: uri,
            hasCustomizedProfile: true
          }
        }));
        get().syncToSupabase();
      },

      setUserName: (firstName: string, lastName: string) => {
        set((state) => ({
          profile: {
            ...state.profile,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            hasCustomizedProfile: true
          }
        }));
        get().syncToSupabase();
      },

      generateUserId: (firstName: string, lastName: string) => {
        const cleanName = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, '');
        const randomDigits = Math.floor(10000 + Math.random() * 90000).toString();
        return `#${cleanName}${randomDigits}`;
      },

      completeOnboarding: async (firstName: string, lastName: string): Promise<void> => {
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

        get().awardXP('special_achievement', 'Welcome to BarBuddy!');
        await get().syncToSupabase();
      },

      addFriend: async (friendUserId: string): Promise<boolean> => {
        try {
          const friend = await get().searchUser(friendUserId);
          if (!friend) return false;

          const { profile } = get();
          if (profile.friends.some(f => f.userId === friendUserId)) {
            return false;
          }

          set((state) => ({
            profile: {
              ...state.profile,
              friends: [...state.profile.friends, friend]
            }
          }));

          get().awardXP('bring_friend', `Added ${friend.name} as a friend`);
          return true;
        } catch {
          return false;
        }
      },

      removeFriend: (friendUserId: string) => {
        set((state) => ({
          profile: {
            ...state.profile,
            friends: state.profile.friends.filter(f => f.userId !== friendUserId)
          }
        }));
      },

      searchUser: async (userId: string): Promise<Friend | null> => {
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
        } catch {
          return null;
        }
      },

      sendFriendRequest: async (friendUserId: string): Promise<boolean> => {
        try {
          return true;
        } catch {
          return false;
        }
      },

      acceptFriendRequest: async (requestId: string): Promise<boolean> => {
        try {
          return true;
        } catch {
          return false;
        }
      },

      declineFriendRequest: async (requestId: string): Promise<boolean> => {
        try {
          return true;
        } catch {
          return false;
        }
      },

      loadFriendRequests: async (): Promise<void> => {
        try {
          // Mock implementation
        } catch (error) {
          console.warn('Error loading friend requests:', error);
        }
      },

      resetProfile: () => {
        const { profile } = get();
        if (!profile.hasCustomizedProfile) {
          set({ profile: defaultProfile });
        }
      },

      resetStats: async (): Promise<void> => {
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
              poolGamesWon: 0,
              dartGamesWon: 0,
              dailyStats: undefined,
            }
          }));
          await get().syncToSupabase();
        } catch (error) {
          console.warn('Error resetting stats:', error);
        }
      },

      syncToSupabase: async (): Promise<void> => {
        try {
          // Mock implementation
        } catch (error) {
          console.warn('Error syncing to Supabase:', error);
        }
      },

      loadFromSupabase: async (): Promise<void> => {
        try {
          // Mock implementation
        } catch (error) {
          console.warn('Error loading from Supabase:', error);
        }
      }
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__userProfileStore = useUserProfileStore;
}