import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface Friend {
  id: string;
  username: string;
  phone: string;
  email?: string | null;
  xp: number;
  nights_out: number;
  bars_hit: number;
  rank_title: string;
  created_at: string;
}

interface FriendRequest {
  id: string;
  from_user_id: string;
  from_username: string;
  from_user_rank: string;
  created_at: string;
}

interface XPActivity {
  id: string;
  type: 'visit_new_bar' | 'participate_event' | 'bring_friend' | 'complete_night_out' | 'special_achievement' | 'live_music' | 'featured_drink' | 'bar_game' | 'photo_taken' | 'shots' | 'scoop_and_scores' | 'beers' | 'beer_towers' | 'funnels' | 'shotguns' | 'pool_games' | 'dart_games' | 'drunk_scale_submission';
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
  lastResetAt: string;
}

interface UserProfile {
  id: string;
  username: string;
  phone: string;
  email?: string | null;
  xp: number;
  nights_out: number;
  bars_hit: number;
  drunk_scale_ratings: number[];
  last_night_out_date?: string;
  last_drunk_scale_date?: string;
  last_drunk_scale_reset?: string;
  profile_picture?: string;
  friends: Friend[];
  friend_requests: FriendRequest[];
  xp_activities: XPActivity[];
  visited_bars: string[];
  total_shots: number;
  total_scoop_and_scores: number;
  total_beers: number;
  total_beer_towers: number;
  total_funnels: number;
  total_shotguns: number;
  pool_games_won: number;
  dart_games_won: number;
  photos_taken: number;
  daily_stats?: DailyStats;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
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
  profile: UserProfile | null;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  incrementNightsOut: () => Promise<void>;
  incrementBarsHit: () => Promise<void>;
  addDrunkScaleRating: (rating: number) => Promise<void>;
  getAverageDrunkScale: () => number;
  getRank: () => RankInfo;
  canIncrementNightsOut: () => boolean;
  canSubmitDrunkScale: () => boolean;
  setProfilePicture: (uri: string) => Promise<void>;
  awardXP: (type: XPActivity['type'], description: string, venueId?: string) => Promise<void>;
  getAllRanks: () => RankInfo[];
  getXPForNextRank: () => number;
  getProgressToNextRank: () => number;
  updateDailyTrackerTotals: (stats: { shots: number; scoopAndScores: number; beers: number; beerTowers: number; funnels: number; shotguns: number; poolGamesWon: number; dartGamesWon: number; }) => Promise<void>;
  getDailyStats: () => DailyStats;
  searchUserByUsername: (username: string) => Promise<Friend | null>;
  sendFriendRequest: (username: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  declineFriendRequest: (requestId: string) => Promise<boolean>;
  loadFriendRequests: () => Promise<void>;
  loadFriends: () => Promise<void>;
  checkAndResetDrunkScaleIfNeeded: () => void;
}

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

const hasPassedMidnight = (lastSubmissionDate?: string): boolean => {
  if (!lastSubmissionDate) return true;
  
  try {
    const lastSubmission = new Date(lastSubmissionDate);
    const now = new Date();
    
    // Check if it's a different day
    if (lastSubmission.getDate() !== now.getDate() || 
        lastSubmission.getMonth() !== now.getMonth() || 
        lastSubmission.getFullYear() !== now.getFullYear()) {
      return true;
    }
    
    return false;
  } catch {
    return true;
  }
};

const shouldResetDrunkScaleAt3AM = (lastResetAt?: string): boolean => {
  try {
    if (!lastResetAt) return true;
    
    const lastReset = new Date(lastResetAt);
    const now = new Date();
    
    // Create 3 AM reset time for today
    const resetTime = new Date(now);
    resetTime.setHours(3, 0, 0, 0);
    
    // If it's past 3 AM today and last reset was before today's 3 AM, reset
    if (now >= resetTime && lastReset < resetTime) {
      return true;
    }
    
    // If it's before 3 AM today, check if last reset was before yesterday's 3 AM
    if (now < resetTime) {
      const yesterdayResetTime = new Date(resetTime);
      yesterdayResetTime.setDate(yesterdayResetTime.getDate() - 1);
      return lastReset < yesterdayResetTime;
    }
    
    return false;
  } catch {
    return true;
  }
};

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      
      loadProfile: async () => {
        try {
          set({ isLoading: true });
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ profile: null, isLoading: false });
            return;
          }

          // Use phone-first logic for profile lookup
          let query = supabase.from('profiles').select('*');
          
          if (user.phone) {
            query = query.eq('phone', user.phone);
          } else if (user.email) {
            query = query.eq('email', user.email);
          } else {
            query = query.eq('id', user.id);
          }

          const { data: profileData, error } = await query.single();

          if (error) {
            console.error('Error loading profile:', error);
            
            // If profile doesn't exist, create it
            if (error.code === 'PGRST116') {
              const newProfileData = {
                id: user.id,
                username: user.user_metadata?.username || `guest_${Math.floor(Math.random() * 100000)}`,
                phone: user.phone || '',
                email: user.email || null,
                xp: 0,
                nights_out: 0,
                bars_hit: 0,
                drunk_scale_ratings: [],
                total_shots: 0,
                total_scoop_and_scores: 0,
                total_beers: 0,
                total_beer_towers: 0,
                total_funnels: 0,
                total_shotguns: 0,
                pool_games_won: 0,
                dart_games_won: 0,
                photos_taken: 0,
                visited_bars: [],
                xp_activities: [],
                has_completed_onboarding: false,
                daily_stats: {}
              };
              
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfileData)
                .select('*')
                .single();
              
              if (!createError) {
                // Load friends and friend requests
                await Promise.all([
                  get().loadFriends(),
                  get().loadFriendRequests()
                ]);

                set({ 
                  profile: {
                    ...newProfile,
                    friends: get().profile?.friends || [],
                    friend_requests: get().profile?.friend_requests || [],
                  }, 
                  isLoading: false 
                });
                return;
              }
            }
            
            set({ isLoading: false });
            return;
          }

          // Load friends and friend requests
          await Promise.all([
            get().loadFriends(),
            get().loadFriendRequests()
          ]);

          set({ 
            profile: {
              ...profileData,
              friends: get().profile?.friends || [],
              friend_requests: get().profile?.friend_requests || [],
            }, 
            isLoading: false 
          });
        } catch (error) {
          console.error('Error loading profile:', error);
          set({ isLoading: false });
        }
      },

      updateProfile: async (updates) => {
        const { profile } = get();
        if (!profile) return;

        try {
          const { error } = await supabase
            .from('profiles')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);

          if (error) {
            console.error('Error updating profile:', error);
            return;
          }

          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null
          }));
        } catch (error) {
          console.error('Error updating profile:', error);
        }
      },

      checkAndResetDrunkScaleIfNeeded: () => {
        const { profile } = get();
        if (!profile) return;

        if (shouldResetDrunkScaleAt3AM(profile.last_drunk_scale_reset)) {
          get().updateProfile({
            last_drunk_scale_date: undefined,
            last_drunk_scale_reset: new Date().toISOString(),
          });
        }
      },
      
      incrementNightsOut: async () => {
        const { profile } = get();
        if (!profile) return;

        const today = new Date().toISOString();
        
        if (!profile.last_night_out_date || !isSameDay(profile.last_night_out_date, today)) {
          const newNightsOut = profile.nights_out + 1;
          
          await get().updateProfile({
            nights_out: newNightsOut,
            last_night_out_date: today
          });
          
          // Award XP for night out
          await get().awardXP('complete_night_out', 'Completed a night out');
          
          // Update achievements
          if (typeof window !== 'undefined' && (window as any).__achievementStore) {
            const achievementStore = (window as any).__achievementStore;
            if (achievementStore?.getState) {
              const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
              checkAndUpdateMultiLevelAchievements({
                totalBeers: profile.total_beers,
                totalShots: profile.total_shots,
                totalBeerTowers: profile.total_beer_towers,
                totalScoopAndScores: profile.total_scoop_and_scores,
                totalFunnels: profile.total_funnels,
                totalShotguns: profile.total_shotguns,
                poolGamesWon: profile.pool_games_won,
                dartGamesWon: profile.dart_games_won,
                barsHit: profile.bars_hit,
                nightsOut: newNightsOut,
              });
            }
          }
        }
      },
      
      incrementBarsHit: async () => {
        const { profile } = get();
        if (!profile) return;

        const newBarsHit = profile.bars_hit + 1;
        
        await get().updateProfile({
          bars_hit: newBarsHit
        });
        
        // Award XP for bar visit
        await get().awardXP('visit_new_bar', 'Visited a new bar');
        
        // Update achievements
        if (typeof window !== 'undefined' && (window as any).__achievementStore) {
          const achievementStore = (window as any).__achievementStore;
          if (achievementStore?.getState) {
            const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
            checkAndUpdateMultiLevelAchievements({
              totalBeers: profile.total_beers,
              totalShots: profile.total_shots,
              totalBeerTowers: profile.total_beer_towers,
              totalScoopAndScores: profile.total_scoop_and_scores,
              totalFunnels: profile.total_funnels,
              totalShotguns: profile.total_shotguns,
              poolGamesWon: profile.pool_games_won,
              dartGamesWon: profile.dart_games_won,
              barsHit: newBarsHit,
              nightsOut: profile.nights_out,
            });
          }
        }
      },
      
      addDrunkScaleRating: async (rating) => {
        const { profile } = get();
        if (!profile) return;

        const today = new Date().toISOString();
        
        await get().updateProfile({
          drunk_scale_ratings: [...profile.drunk_scale_ratings, rating],
          last_drunk_scale_date: today
        });
        
        // Award XP for drunk scale submission
        await get().awardXP('drunk_scale_submission', `Submitted drunk scale rating: ${rating}/10`);
      },
      
      getAverageDrunkScale: () => {
        const { profile } = get();
        if (!profile || profile.drunk_scale_ratings.length === 0) return 0;
        
        const sum = profile.drunk_scale_ratings.reduce((acc, rating) => acc + rating, 0);
        return Math.round((sum / profile.drunk_scale_ratings.length) * 10) / 10;
      },
      
      getRank: () => {
        const { profile } = get();
        if (!profile) return RANK_STRUCTURE[0];
        return getRankByXP(profile.xp);
      },
      
      getAllRanks: () => RANK_STRUCTURE,
      
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
        const { profile } = get();
        if (!profile) return 0;
        
        const currentRank = get().getRank();
        const nextRankXP = get().getXPForNextRank();
        
        if (nextRankXP === currentRank.maxXP) return 100;
        
        const progress = ((profile.xp - currentRank.minXP) / (nextRankXP - currentRank.minXP)) * 100;
        return Math.min(Math.max(progress, 0), 100);
      },
      
      awardXP: async (type, description, venueId) => {
        const { profile } = get();
        if (!profile) return;

        const xpAmount = XP_VALUES[type];
        const activityId = Math.random().toString(36).substr(2, 9);
        
        const newActivity: XPActivity = {
          id: activityId,
          type,
          xpAwarded: xpAmount,
          timestamp: new Date().toISOString(),
          description,
        };
        
        let updates: Partial<UserProfile> = {
          xp: profile.xp + xpAmount,
          xp_activities: [...profile.xp_activities, newActivity],
        };
        
        switch (type) {
          case 'visit_new_bar':
            if (venueId && !profile.visited_bars.includes(venueId)) {
              updates.visited_bars = [...profile.visited_bars, venueId];
            }
            break;
          case 'photo_taken':
            updates.photos_taken = profile.photos_taken + 1;
            break;
          case 'pool_games':
            updates.pool_games_won = profile.pool_games_won + 1;
            break;
          case 'dart_games':
            updates.dart_games_won = profile.dart_games_won + 1;
            break;
        }
        
        await get().updateProfile(updates);
      },
      
      updateDailyTrackerTotals: async (stats) => {
        const { profile } = get();
        if (!profile) return;

        const today = getTodayString();
        const currentDailyStats = profile.daily_stats;
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
          lastResetAt: currentDailyStats?.lastResetAt || new Date().toISOString(),
        };
        
        // Award XP for each activity increase
        if (shotsDiff > 0) {
          for (let i = 0; i < shotsDiff; i++) {
            await get().awardXP('shots', 'Took a shot');
          }
        }
        if (scoopDiff > 0) {
          for (let i = 0; i < scoopDiff; i++) {
            await get().awardXP('scoop_and_scores', 'Had a Scoop & Score');
          }
        }
        if (beersDiff > 0) {
          for (let i = 0; i < beersDiff; i++) {
            await get().awardXP('beers', 'Had a beer');
          }
        }
        if (beerTowersDiff > 0) {
          for (let i = 0; i < beerTowersDiff; i++) {
            await get().awardXP('beer_towers', 'Finished a beer tower');
          }
        }
        if (funnelsDiff > 0) {
          for (let i = 0; i < funnelsDiff; i++) {
            await get().awardXP('funnels', 'Did a funnel');
          }
        }
        if (shotgunsDiff > 0) {
          for (let i = 0; i < shotgunsDiff; i++) {
            await get().awardXP('shotguns', 'Did a shotgun');
          }
        }
        if (poolDiff > 0) {
          for (let i = 0; i < poolDiff; i++) {
            await get().awardXP('pool_games', 'Won a pool game');
          }
        }
        if (dartDiff > 0) {
          for (let i = 0; i < dartDiff; i++) {
            await get().awardXP('dart_games', 'Won a dart game');
          }
        }
        
        await get().updateProfile({
          total_shots: profile.total_shots + shotsDiff,
          total_scoop_and_scores: profile.total_scoop_and_scores + scoopDiff,
          total_beers: profile.total_beers + beersDiff,
          total_beer_towers: profile.total_beer_towers + beerTowersDiff,
          total_funnels: profile.total_funnels + funnelsDiff,
          total_shotguns: profile.total_shotguns + shotgunsDiff,
          pool_games_won: profile.pool_games_won + poolDiff,
          dart_games_won: profile.dart_games_won + dartDiff,
          daily_stats: newDailyStats,
        });

        // Update achievements
        if (typeof window !== 'undefined' && (window as any).__achievementStore) {
          const achievementStore = (window as any).__achievementStore;
          if (achievementStore?.getState) {
            const { checkAndUpdateMultiLevelAchievements } = achievementStore.getState();
            checkAndUpdateMultiLevelAchievements({
              totalBeers: profile.total_beers + beersDiff,
              totalShots: profile.total_shots + shotsDiff,
              totalBeerTowers: profile.total_beer_towers + beerTowersDiff,
              totalScoopAndScores: profile.total_scoop_and_scores + scoopDiff,
              totalFunnels: profile.total_funnels + funnelsDiff,
              totalShotguns: profile.total_shotguns + shotgunsDiff,
              poolGamesWon: profile.pool_games_won + poolDiff,
              dartGamesWon: profile.dart_games_won + dartDiff,
              barsHit: profile.bars_hit,
              nightsOut: profile.nights_out,
            });
          }
        }
      },

      getDailyStats: () => {
        const { profile } = get();
        if (!profile) {
          return {
            shots: 0,
            scoopAndScores: 0,
            beers: 0,
            beerTowers: 0,
            funnels: 0,
            shotguns: 0,
            poolGamesWon: 0,
            dartGamesWon: 0,
            date: getTodayString(),
            lastResetAt: new Date().toISOString(),
          };
        }

        const today = getTodayString();
        
        if (profile.daily_stats?.date === today) {
          return profile.daily_stats;
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
          lastResetAt: new Date().toISOString(),
        };
      },
      
      canIncrementNightsOut: () => {
        const { profile } = get();
        if (!profile) return true;
        
        const today = new Date().toISOString();
        return !profile.last_night_out_date || !isSameDay(profile.last_night_out_date, today);
      },

      canSubmitDrunkScale: () => {
        const { profile } = get();
        if (!profile) return true;
        
        // Check if we need to reset first
        get().checkAndResetDrunkScaleIfNeeded();
        
        // Use 24-hour check instead of 3 AM reset for drunk scale
        return hasPassedMidnight(profile.last_drunk_scale_date);
      },

      setProfilePicture: async (uri: string) => {
        await get().updateProfile({ profile_picture: uri });
      },

      searchUserByUsername: async (username: string): Promise<Friend | null> => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, username, phone, email, xp, nights_out, bars_hit, created_at')
            .eq('username', username)
            .single();

          if (error || !data) {
            return null;
          }

          const rank = getRankByXP(data.xp);

          return {
            id: data.id,
            username: data.username,
            phone: data.phone,
            email: data.email,
            xp: data.xp,
            nights_out: data.nights_out,
            bars_hit: data.bars_hit,
            rank_title: rank.title,
            created_at: data.created_at,
          };
        } catch (error) {
          console.error('Error searching user:', error);
          return null;
        }
      },

      sendFriendRequest: async (username: string): Promise<boolean> => {
        const { profile } = get();
        if (!profile) return false;

        try {
          // First find the user by username
          const targetUser = await get().searchUserByUsername(username);
          if (!targetUser) return false;

          // Check if already friends
          const { data: existingFriend } = await supabase
            .from('friends')
            .select('id')
            .or(`and(user_id.eq.${profile.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${profile.id})`)
            .single();

          if (existingFriend) return false;

          // Check if request already exists
          const { data: existingRequest } = await supabase
            .from('friend_requests')
            .select('id')
            .or(`and(from_user_id.eq.${profile.id},to_user_id.eq.${targetUser.id}),and(from_user_id.eq.${targetUser.id},to_user_id.eq.${profile.id})`)
            .single();

          if (existingRequest) return false;

          // Send friend request
          const { error } = await supabase
            .from('friend_requests')
            .insert({
              from_user_id: profile.id,
              to_user_id: targetUser.id,
            });

          return !error;
        } catch (error) {
          console.error('Error sending friend request:', error);
          return false;
        }
      },

      acceptFriendRequest: async (requestId: string): Promise<boolean> => {
        const { profile } = get();
        if (!profile) return false;

        try {
          // Get the friend request
          const { data: request, error: requestError } = await supabase
            .from('friend_requests')
            .select('from_user_id, to_user_id')
            .eq('id', requestId)
            .eq('to_user_id', profile.id)
            .single();

          if (requestError || !request) return false;

          // Create friendship (both directions)
          const { error: friendError } = await supabase
            .from('friends')
            .insert([
              { user_id: profile.id, friend_id: request.from_user_id },
              { user_id: request.from_user_id, friend_id: profile.id }
            ]);

          if (friendError) return false;

          // Update request status
          const { error: updateError } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted', responded_at: new Date().toISOString() })
            .eq('id', requestId);

          if (updateError) return false;

          // Reload friends and requests
          await Promise.all([
            get().loadFriends(),
            get().loadFriendRequests()
          ]);

          return true;
        } catch (error) {
          console.error('Error accepting friend request:', error);
          return false;
        }
      },

      declineFriendRequest: async (requestId: string): Promise<boolean> => {
        const { profile } = get();
        if (!profile) return false;

        try {
          const { error } = await supabase
            .from('friend_requests')
            .update({ status: 'declined', responded_at: new Date().toISOString() })
            .eq('id', requestId)
            .eq('to_user_id', profile.id);

          if (error) return false;

          await get().loadFriendRequests();
          return true;
        } catch (error) {
          console.error('Error declining friend request:', error);
          return false;
        }
      },

      loadFriendRequests: async () => {
        const { profile } = get();
        if (!profile) return;

        try {
          const { data, error } = await supabase
            .from('friend_requests')
            .select(`
              id,
              from_user_id,
              created_at,
              from_user:profiles!friend_requests_from_user_id_fkey(username, xp)
            `)
            .eq('to_user_id', profile.id)
            .eq('status', 'pending');

          if (error) {
            console.error('Error loading friend requests:', error);
            return;
          }

          const friendRequests: FriendRequest[] = (data || []).map((request: any) => {
            const rank = getRankByXP(request.from_user?.xp || 0);
            return {
              id: request.id,
              from_user_id: request.from_user_id,
              from_username: request.from_user?.username || 'Unknown',
              from_user_rank: rank.title,
              created_at: request.created_at,
            };
          });

          set((state) => ({
            profile: state.profile ? {
              ...state.profile,
              friend_requests: friendRequests
            } : null
          }));
        } catch (error) {
          console.error('Error loading friend requests:', error);
        }
      },

      loadFriends: async () => {
        const { profile } = get();
        if (!profile) return;

        try {
          const { data, error } = await supabase
            .from('friends')
            .select(`
              id,
              friend_id,
              created_at,
              friend:profiles!friends_friend_id_fkey(id, username, phone, email, xp, nights_out, bars_hit, created_at)
            `)
            .eq('user_id', profile.id);

          if (error) {
            console.error('Error loading friends:', error);
            return;
          }

          const friends: Friend[] = (data || []).map((friendship: any) => {
            const friend = friendship.friend;
            const rank = getRankByXP(friend?.xp || 0);
            return {
              id: friend?.id || '',
              username: friend?.username || 'Unknown',
              phone: friend?.phone || '',
              email: friend?.email || null,
              xp: friend?.xp || 0,
              nights_out: friend?.nights_out || 0,
              bars_hit: friend?.bars_hit || 0,
              rank_title: rank.title,
              created_at: friendship.created_at,
            };
          });

          set((state) => ({
            profile: state.profile ? {
              ...state.profile,
              friends
            } : null
          }));
        } catch (error) {
          console.error('Error loading friends:', error);
        }
      },
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        profile: state.profile ? {
          id: state.profile.id,
          username: state.profile.username,
          phone: state.profile.phone,
        } : null,
      }),
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__userProfileStore = useUserProfileStore;
}