import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  category: 'bars' | 'activities' | 'social' | 'milestones' | 'special' | 'consumption' | 'nights' | 'games';
  completed: boolean;
  completedAt?: string;
  icon: string;
  progress?: number;
  maxProgress?: number;
  order: number;
  level?: number;
  isMultiLevel?: boolean;
  nextLevelId?: string;
}

interface AchievementState {
  achievements: Achievement[];
  popupShown: boolean;
  lastPopupDate: string | null;
  initializeAchievements: () => void;
  completeAchievement: (id: string) => void;
  getCompletedCount: () => number;
  resetAchievements: () => void;
  updateAchievementProgress: (id: string, progress: number) => void;
  markPopupShown: () => void;
  shouldShowPopup: () => boolean;
  shouldShow3AMPopup: () => boolean;
  mark3AMPopupShown: () => void;
  checkAndUpdateMultiLevelAchievements: (userStats: { 
    totalBeers: number; 
    totalShots: number; 
    totalBeerTowers: number;
    totalScoopAndScores: number;
    totalFunnels: number;
    totalShotguns: number;
    totalPoolGamesWon: number;
    totalDartGamesWon: number;
    barsHit: number;
    nightsOut: number;
  }) => void;
}

const defaultAchievements: Achievement[] = [
  // Milestones
  {
    id: 'first-night-out',
    title: 'First Night Out',
    description: 'Completed your first night out with BarBuddy',
    detailedDescription: 'Your journey begins! This achievement marks your first night out tracked with BarBuddy.',
    category: 'milestones',
    completed: false,
    icon: '🌟',
    order: 1,
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Went out on both Friday and Saturday',
    detailedDescription: 'The ultimate weekend dedication - going out both Friday and Saturday nights in the same weekend.',
    category: 'milestones',
    completed: false,
    icon: '⚡',
    order: 2,
  },
  
  // Bar Hopping
  {
    id: 'bar-hopper',
    title: 'Bar Hopper',
    description: 'Visited 2 different bars in one night',
    detailedDescription: 'You\'ve started your bar hopping journey by visiting multiple bars in a single night.',
    category: 'bars',
    completed: false,
    icon: '🍺',
    order: 3,
  },
  {
    id: 'three-bars-night',
    title: 'Triple Threat',
    description: 'Went to 3 bars in one night',
    detailedDescription: 'A true bar crawler! You visited three different bars in a single night.',
    category: 'bars',
    completed: false,
    icon: '🍻',
    progress: 0,
    maxProgress: 3,
    order: 4,
  },

  // Multi-Level Bars Visited Achievements
  {
    id: 'bar-explorer',
    title: 'Bar Explorer',
    description: 'Visit 5 different bars total',
    detailedDescription: 'You\'ve begun your journey exploring the local bar scene.',
    category: 'bars',
    completed: false,
    icon: '🗺️',
    progress: 0,
    maxProgress: 5,
    order: 5,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'bar-adventurer',
  },
  {
    id: 'bar-adventurer',
    title: 'Bar Adventurer',
    description: 'Visit 15 different bars total',
    detailedDescription: 'Your bar exploration continues as you discover more venues.',
    category: 'bars',
    completed: false,
    icon: '🗺️',
    progress: 0,
    maxProgress: 15,
    order: 6,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'bar-enthusiast',
  },
  {
    id: 'bar-enthusiast',
    title: 'Bar Enthusiast',
    description: 'Visit 30 different bars total',
    detailedDescription: 'You\'re becoming a true connoisseur of the local nightlife scene.',
    category: 'bars',
    completed: false,
    icon: '🗺️',
    progress: 0,
    maxProgress: 30,
    order: 7,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'bar-connoisseur',
  },
  {
    id: 'bar-connoisseur',
    title: 'Bar Connoisseur',
    description: 'Visit 50 different bars total',
    detailedDescription: 'Your knowledge of bars is extensive and impressive.',
    category: 'bars',
    completed: false,
    icon: '🗺️',
    progress: 0,
    maxProgress: 50,
    order: 8,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'bar-legend',
  },
  {
    id: 'bar-legend',
    title: 'Bar Legend',
    description: 'Visit 100 different bars total',
    detailedDescription: 'You\'ve achieved legendary status in the bar scene. Your name is known in every establishment.',
    category: 'bars',
    completed: false,
    icon: '🗺️',
    progress: 0,
    maxProgress: 100,
    order: 9,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Nights Out Achievements
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete 10 nights out total',
    detailedDescription: 'You\'ve embraced the nightlife and completed your first milestone of nights out.',
    category: 'nights',
    completed: false,
    icon: '🦉',
    progress: 0,
    maxProgress: 10,
    order: 10,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'party-goer',
  },
  {
    id: 'party-goer',
    title: 'Party Goer',
    description: 'Complete 25 nights out total',
    detailedDescription: 'Your dedication to the nightlife is becoming impressive.',
    category: 'nights',
    completed: false,
    icon: '🎉',
    progress: 0,
    maxProgress: 25,
    order: 11,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'social-butterfly-nights',
  },
  {
    id: 'social-butterfly-nights',
    title: 'Social Butterfly',
    description: 'Complete 50 nights out total',
    detailedDescription: 'You\'re a true social butterfly, always out and about in the nightlife scene.',
    category: 'nights',
    completed: false,
    icon: '🦋',
    progress: 0,
    maxProgress: 50,
    order: 12,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'nightlife-aficionado',
  },
  {
    id: 'nightlife-aficionado',
    title: 'Nightlife Aficionado',
    description: 'Complete 75 nights out total',
    detailedDescription: 'Your expertise in nightlife activities is reaching professional levels.',
    category: 'nights',
    completed: false,
    icon: '🌙',
    progress: 0,
    maxProgress: 75,
    order: 13,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'nightlife-legend',
  },
  {
    id: 'nightlife-legend',
    title: 'Nightlife Legend',
    description: 'Complete 100 nights out total',
    detailedDescription: 'You\'ve achieved legendary status in the nightlife world. Your stories are the stuff of legend.',
    category: 'nights',
    completed: false,
    icon: '👑',
    progress: 0,
    maxProgress: 100,
    order: 14,
    level: 5,
    isMultiLevel: true,
  },
  
  // Multi-Level Beer Achievements
  {
    id: 'beer-beginner',
    title: 'Beer Beginner',
    description: 'Drink 10 beers total',
    detailedDescription: 'You\'ve started your beer journey with your first milestone.',
    category: 'consumption',
    completed: false,
    icon: '🍺',
    progress: 0,
    maxProgress: 10,
    order: 15,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'brew-enthusiast',
  },
  {
    id: 'brew-enthusiast',
    title: 'Brew Enthusiast',
    description: 'Drink 50 beers total',
    detailedDescription: 'Your appreciation for beer is growing stronger with each pint.',
    category: 'consumption',
    completed: false,
    icon: '🍻',
    progress: 0,
    maxProgress: 50,
    order: 16,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'lager-lover',
  },
  {
    id: 'lager-lover',
    title: 'Lager Lover',
    description: 'Drink 100 beers total',
    detailedDescription: 'Your beer expertise is becoming impressive as you reach this significant milestone.',
    category: 'consumption',
    completed: false,
    icon: '🍺',
    progress: 0,
    maxProgress: 100,
    order: 17,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'ale-aficionado',
  },
  {
    id: 'ale-aficionado',
    title: 'Ale Aficionado',
    description: 'Drink 250 beers total',
    detailedDescription: 'You\'ve developed a sophisticated palate and deep appreciation for beer.',
    category: 'consumption',
    completed: false,
    icon: '🍻',
    progress: 0,
    maxProgress: 250,
    order: 18,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'beer-annihilator',
  },
  {
    id: 'beer-annihilator',
    title: 'Beer Annihilator',
    description: 'Drink 500 beers total',
    detailedDescription: 'You\'ve reached legendary status in beer consumption. Your tolerance is the stuff of legends.',
    category: 'consumption',
    completed: false,
    icon: '🍺',
    progress: 0,
    maxProgress: 500,
    order: 19,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Shot Achievements
  {
    id: 'shot-starter',
    title: 'Shot Starter',
    description: 'Take 10 shots total',
    detailedDescription: 'You\'ve begun your journey into the world of shots.',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 10,
    order: 20,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'quick-shooter',
  },
  {
    id: 'quick-shooter',
    title: 'Quick Shooter',
    description: 'Take 30 shots total',
    detailedDescription: 'Your shot-taking skills are becoming more refined with practice.',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 30,
    order: 21,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'shot-pro',
  },
  {
    id: 'shot-pro',
    title: 'Shot Pro',
    description: 'Take 75 shots total',
    detailedDescription: 'You\'ve developed professional-level shot skills and impressive tolerance.',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 75,
    order: 22,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'shot-master',
  },
  {
    id: 'shot-master',
    title: 'Shot Master',
    description: 'Take 150 shots total',
    detailedDescription: 'Your mastery of shots is unquestionable. Few can match your expertise.',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 150,
    order: 23,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'shot-legend',
  },
  {
    id: 'shot-legend',
    title: 'Shot Legend',
    description: 'Take 300 shots total',
    detailedDescription: 'You\'ve achieved legendary status in the world of shots. Your name is whispered with awe in bars everywhere.',
    category: 'consumption',
    completed: false,
    icon: '🥃',
    progress: 0,
    maxProgress: 300,
    order: 24,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Beer Tower Achievements
  {
    id: 'tower-rookie',
    title: 'Tower Rookie',
    description: 'Finish 5 beer towers total',
    detailedDescription: 'You\'ve begun your journey with beer towers, showing promise for greater achievements.',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 5,
    order: 25,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'tower-enthusiast',
  },
  {
    id: 'tower-enthusiast',
    title: 'Tower Enthusiast',
    description: 'Finish 15 beer towers total',
    detailedDescription: 'Your enthusiasm for beer towers is growing, as is your reputation.',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 15,
    order: 26,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'tower-master',
  },
  {
    id: 'tower-master',
    title: 'Tower Master',
    description: 'Finish 30 beer towers total',
    detailedDescription: 'You\'ve mastered the art of the beer tower, a feat few can claim.',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 30,
    order: 27,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'tower-connoisseur',
  },
  {
    id: 'tower-connoisseur',
    title: 'Tower Connoisseur',
    description: 'Finish 50 beer towers total',
    detailedDescription: 'Your sophisticated approach to beer towers sets you apart as a true connoisseur.',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 50,
    order: 28,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'tower-titan',
  },
  {
    id: 'tower-titan',
    title: 'Tower Titan',
    description: 'Finish 100 beer towers total',
    detailedDescription: 'You stand as a titan among beer tower enthusiasts, your achievements towering over others.',
    category: 'consumption',
    completed: false,
    icon: '🗼',
    progress: 0,
    maxProgress: 100,
    order: 29,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Scoop and Score Achievements
  {
    id: 'rookie-scooper',
    title: 'Rookie Scooper',
    description: 'Complete 10 scoop and scores total',
    detailedDescription: 'You\'ve begun your scoop and score journey with promising skill.',
    category: 'consumption',
    completed: false,
    icon: '🥄',
    progress: 0,
    maxProgress: 10,
    order: 30,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'scoop-enthusiast',
  },
  {
    id: 'scoop-enthusiast',
    title: 'Scoop Enthusiast',
    description: 'Complete 25 scoop and scores total',
    detailedDescription: 'Your enthusiasm for the scoop and score technique is becoming notable.',
    category: 'consumption',
    completed: false,
    icon: '🥄',
    progress: 0,
    maxProgress: 25,
    order: 31,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'scoop-pro',
  },
  {
    id: 'scoop-pro',
    title: 'Scoop Pro',
    description: 'Complete 50 scoop and scores total',
    detailedDescription: 'You\'ve developed professional-level skills in the art of scoop and score.',
    category: 'consumption',
    completed: false,
    icon: '🥄',
    progress: 0,
    maxProgress: 50,
    order: 32,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'scoop-master',
  },
  {
    id: 'scoop-master',
    title: 'Scoop Master',
    description: 'Complete 100 scoop and scores total',
    detailedDescription: 'Your mastery of the scoop and score technique is unparalleled.',
    category: 'consumption',
    completed: false,
    icon: '🥄',
    progress: 0,
    maxProgress: 100,
    order: 33,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'scoop-champion',
  },
  {
    id: 'scoop-champion',
    title: 'Scoop Champion',
    description: 'Complete 200 scoop and scores total',
    detailedDescription: 'You\'ve achieved championship status in the world of scoop and score.',
    category: 'consumption',
    completed: false,
    icon: '🥄',
    progress: 0,
    maxProgress: 200,
    order: 34,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Funnel Achievements
  {
    id: 'funnel-novice',
    title: 'Funnel Novice',
    description: 'Complete 5 funnels total',
    detailedDescription: 'You\'ve taken your first steps into the world of funneling.',
    category: 'consumption',
    completed: false,
    icon: '🌪️',
    progress: 0,
    maxProgress: 5,
    order: 35,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'funnel-enthusiast',
  },
  {
    id: 'funnel-enthusiast',
    title: 'Funnel Enthusiast',
    description: 'Complete 15 funnels total',
    detailedDescription: 'Your enthusiasm for funneling is becoming well-known among your friends.',
    category: 'consumption',
    completed: false,
    icon: '🌪️',
    progress: 0,
    maxProgress: 15,
    order: 36,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'funnel-pro',
  },
  {
    id: 'funnel-pro',
    title: 'Funnel Pro',
    description: 'Complete 30 funnels total',
    detailedDescription: 'You\'ve developed professional-level skills in the art of funneling.',
    category: 'consumption',
    completed: false,
    icon: '🌪️',
    progress: 0,
    maxProgress: 30,
    order: 37,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'funnel-master',
  },
  {
    id: 'funnel-master',
    title: 'Funnel Master',
    description: 'Complete 50 funnels total',
    detailedDescription: 'Your mastery of funneling techniques is impressive and rare.',
    category: 'consumption',
    completed: false,
    icon: '🌪️',
    progress: 0,
    maxProgress: 50,
    order: 38,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'funnel-champion',
  },
  {
    id: 'funnel-champion',
    title: 'Funnel Champion',
    description: 'Complete 75 funnels total',
    detailedDescription: 'You\'ve achieved championship status in the world of funneling.',
    category: 'consumption',
    completed: false,
    icon: '🌪️',
    progress: 0,
    maxProgress: 75,
    order: 39,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Shotgun Achievements
  {
    id: 'shotgun-novice',
    title: 'Shotgun Novice',
    description: 'Complete 10 shotguns total',
    detailedDescription: 'You\'ve begun your shotgunning journey with promising technique.',
    category: 'consumption',
    completed: false,
    icon: '🔫',
    progress: 0,
    maxProgress: 10,
    order: 40,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'shotgun-enthusiast',
  },
  {
    id: 'shotgun-enthusiast',
    title: 'Shotgun Enthusiast',
    description: 'Complete 25 shotguns total',
    detailedDescription: 'Your enthusiasm for shotgunning is becoming notable among your peers.',
    category: 'consumption',
    completed: false,
    icon: '🔫',
    progress: 0,
    maxProgress: 25,
    order: 41,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'shotgun-pro',
  },
  {
    id: 'shotgun-pro',
    title: 'Shotgun Pro',
    description: 'Complete 50 shotguns total',
    detailedDescription: 'You\'ve developed professional-level skills in the art of shotgunning.',
    category: 'consumption',
    completed: false,
    icon: '🔫',
    progress: 0,
    maxProgress: 50,
    order: 42,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'shotgun-master',
  },
  {
    id: 'shotgun-master',
    title: 'Shotgun Master',
    description: 'Complete 75 shotguns total',
    detailedDescription: 'Your mastery of shotgunning techniques is impressive and rare.',
    category: 'consumption',
    completed: false,
    icon: '🔫',
    progress: 0,
    maxProgress: 75,
    order: 43,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'shotgun-champion',
  },
  {
    id: 'shotgun-champion',
    title: 'Shotgun Champion',
    description: 'Complete 100 shotguns total',
    detailedDescription: 'You\'ve achieved championship status in the world of shotgunning.',
    category: 'consumption',
    completed: false,
    icon: '🔫',
    progress: 0,
    maxProgress: 100,
    order: 44,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Pool Game Achievements
  {
    id: 'pool-rookie',
    title: 'Pool Rookie',
    description: 'Win 5 pool games total',
    detailedDescription: 'You\'ve begun your pool journey with promising skill.',
    category: 'games',
    completed: false,
    icon: '🎱',
    progress: 0,
    maxProgress: 5,
    order: 45,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'pool-enthusiast',
  },
  {
    id: 'pool-enthusiast',
    title: 'Pool Enthusiast',
    description: 'Win 15 pool games total',
    detailedDescription: 'Your enthusiasm for pool is becoming notable among your peers.',
    category: 'games',
    completed: false,
    icon: '🎱',
    progress: 0,
    maxProgress: 15,
    order: 46,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'pool-pro',
  },
  {
    id: 'pool-pro',
    title: 'Pool Pro',
    description: 'Win 30 pool games total',
    detailedDescription: 'You\'ve developed professional-level skills in the game of pool.',
    category: 'games',
    completed: false,
    icon: '🎱',
    progress: 0,
    maxProgress: 30,
    order: 47,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'pool-master',
  },
  {
    id: 'pool-master',
    title: 'Pool Master',
    description: 'Win 50 pool games total',
    detailedDescription: 'Your mastery of pool techniques is impressive and rare.',
    category: 'games',
    completed: false,
    icon: '🎱',
    progress: 0,
    maxProgress: 50,
    order: 48,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'pool-champion',
  },
  {
    id: 'pool-champion',
    title: 'Pool Champion',
    description: 'Win 75 pool games total',
    detailedDescription: 'You\'ve achieved championship status in the world of pool.',
    category: 'games',
    completed: false,
    icon: '🎱',
    progress: 0,
    maxProgress: 75,
    order: 49,
    level: 5,
    isMultiLevel: true,
  },

  // Multi-Level Dart Game Achievements
  {
    id: 'dart-rookie',
    title: 'Dart Rookie',
    description: 'Win 5 dart games total',
    detailedDescription: 'You\'ve begun your dart journey with promising accuracy.',
    category: 'games',
    completed: false,
    icon: '🎯',
    progress: 0,
    maxProgress: 5,
    order: 50,
    level: 1,
    isMultiLevel: true,
    nextLevelId: 'dart-enthusiast',
  },
  {
    id: 'dart-enthusiast',
    title: 'Dart Enthusiast',
    description: 'Win 15 dart games total',
    detailedDescription: 'Your enthusiasm for darts is becoming notable among your peers.',
    category: 'games',
    completed: false,
    icon: '🎯',
    progress: 0,
    maxProgress: 15,
    order: 51,
    level: 2,
    isMultiLevel: true,
    nextLevelId: 'dart-pro',
  },
  {
    id: 'dart-pro',
    title: 'Dart Pro',
    description: 'Win 30 dart games total',
    detailedDescription: 'You\'ve developed professional-level skills in the game of darts.',
    category: 'games',
    completed: false,
    icon: '🎯',
    progress: 0,
    maxProgress: 30,
    order: 52,
    level: 3,
    isMultiLevel: true,
    nextLevelId: 'dart-master',
  },
  {
    id: 'dart-master',
    title: 'Dart Master',
    description: 'Win 50 dart games total',
    detailedDescription: 'Your mastery of dart techniques is impressive and rare.',
    category: 'games',
    completed: false,
    icon: '🎯',
    progress: 0,
    maxProgress: 50,
    order: 53,
    level: 4,
    isMultiLevel: true,
    nextLevelId: 'dart-champion',
  },
  {
    id: 'dart-champion',
    title: 'Dart Champion',
    description: 'Win 75 dart games total',
    detailedDescription: 'You\'ve achieved championship status in the world of darts.',
    category: 'games',
    completed: false,
    icon: '🎯',
    progress: 0,
    maxProgress: 75,
    order: 54,
    level: 5,
    isMultiLevel: true,
  },
  
  // Activities
  {
    id: 'photo-enthusiast',
    title: 'Photo Enthusiast',
    description: 'Took 10 photos during your night out',
    detailedDescription: 'You\'ve captured memories of your nights out with friends.',
    category: 'activities',
    completed: false,
    icon: '📸',
    progress: 0,
    maxProgress: 10,
    order: 55,
  },
  {
    id: 'photo-master',
    title: 'Photo Master',
    description: 'Took 50 photos total',
    detailedDescription: 'Your photography skills are on point! You\'ve documented your nightlife adventures extensively.',
    category: 'activities',
    completed: false,
    icon: '📷',
    progress: 0,
    maxProgress: 50,
    order: 56,
  },
  {
    id: 'karaoke-star',
    title: 'Karaoke Star',
    description: 'Sang karaoke at a venue',
    detailedDescription: 'You took the stage and showed off your vocal talents!',
    category: 'activities',
    completed: false,
    icon: '🎤',
    order: 57,
  },
  {
    id: 'trivia-master',
    title: 'Trivia Master',
    description: 'Participated in trivia night',
    detailedDescription: 'You put your knowledge to the test at a bar trivia night.',
    category: 'activities',
    completed: false,
    icon: '🧠',
    order: 58,
  },
  {
    id: 'pool-shark',
    title: 'Pool Shark',
    description: 'Played pool or billiards',
    detailedDescription: 'You showed off your skills at the pool table.',
    category: 'activities',
    completed: false,
    icon: '🎱',
    order: 59,
  },
  
  // Social
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Made 5 new connections',
    detailedDescription: 'You\'re expanding your social circle through your nightlife adventures.',
    category: 'social',
    completed: false,
    icon: '🦋',
    progress: 0,
    maxProgress: 5,
    order: 60,
  },
  {
    id: 'conversation-starter',
    title: 'Conversation Starter',
    description: 'Started a chat in a venue',
    detailedDescription: 'You broke the ice and started a conversation with someone new.',
    category: 'social',
    completed: false,
    icon: '💬',
    order: 61,
  },
  {
    id: 'group-leader',
    title: 'Group Leader',
    description: 'Went out with 5+ friends',
    detailedDescription: 'You organized a night out with a large group of friends.',
    category: 'social',
    completed: false,
    icon: '👥',
    order: 62,
  },

  // Special Achievement - Trifecta
  {
    id: 'trifecta',
    title: 'Trifecta',
    description: 'Win pool at JBA, darts at The Bird, and take a group shot at Late Nite',
    detailedDescription: 'You\'ve completed the ultimate bar challenge by winning pool at JBA, winning darts at The Bird, and taking a group shot at Late Nite all in one night!',
    category: 'special',
    completed: false,
    icon: '🏆',
    order: 63,
  },
];

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

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: [],
      popupShown: false,
      lastPopupDate: null,

      initializeAchievements: () => {
        try {
          const { achievements } = get();
          if (achievements.length === 0) {
            set({ achievements: defaultAchievements });
          }
        } catch (error) {
          console.warn('Error initializing achievements:', error);
          set({ achievements: defaultAchievements });
        }
      },

      completeAchievement: (id: string) => {
        try {
          set((state) => ({
            achievements: state.achievements.map(achievement =>
              achievement.id === id
                ? { ...achievement, completed: true, completedAt: new Date().toISOString() }
                : achievement
            )
          }));
        } catch (error) {
          console.warn('Error completing achievement:', error);
        }
      },

      updateAchievementProgress: (id: string, progress: number) => {
        try {
          set((state) => ({
            achievements: state.achievements.map(achievement =>
              achievement.id === id
                ? { 
                    ...achievement, 
                    progress,
                    completed: achievement.maxProgress ? progress >= achievement.maxProgress : achievement.completed,
                    completedAt: achievement.maxProgress && progress >= achievement.maxProgress && !achievement.completed 
                      ? new Date().toISOString() 
                      : achievement.completedAt
                  }
                : achievement
            )
          }));
        } catch (error) {
          console.warn('Error updating achievement progress:', error);
        }
      },

      checkAndUpdateMultiLevelAchievements: (userStats) => {
        try {
          const { achievements } = get();
          let updatedAchievements = [...achievements];
          let hasChanges = false;

          // Check beer achievements
          const beerAchievements = [
            { id: 'beer-beginner', threshold: 10 },
            { id: 'brew-enthusiast', threshold: 50 },
            { id: 'lager-lover', threshold: 100 },
            { id: 'ale-aficionado', threshold: 250 },
            { id: 'beer-annihilator', threshold: 500 },
          ];

          beerAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.totalBeers, threshold);
              const shouldComplete = userStats.totalBeers >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check shot achievements
          const shotAchievements = [
            { id: 'shot-starter', threshold: 10 },
            { id: 'quick-shooter', threshold: 30 },
            { id: 'shot-pro', threshold: 75 },
            { id: 'shot-master', threshold: 150 },
            { id: 'shot-legend', threshold: 300 },
          ];

          shotAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.totalShots, threshold);
              const shouldComplete = userStats.totalShots >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check beer tower achievements
          const towerAchievements = [
            { id: 'tower-rookie', threshold: 5 },
            { id: 'tower-enthusiast', threshold: 15 },
            { id: 'tower-master', threshold: 30 },
            { id: 'tower-connoisseur', threshold: 50 },
            { id: 'tower-titan', threshold: 100 },
          ];

          towerAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.totalBeerTowers, threshold);
              const shouldComplete = userStats.totalBeerTowers >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check scoop and score achievements
          const scoopAchievements = [
            { id: 'rookie-scooper', threshold: 10 },
            { id: 'scoop-enthusiast', threshold: 25 },
            { id: 'scoop-pro', threshold: 50 },
            { id: 'scoop-master', threshold: 100 },
            { id: 'scoop-champion', threshold: 200 },
          ];

          scoopAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.totalScoopAndScores, threshold);
              const shouldComplete = userStats.totalScoopAndScores >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check funnel achievements
          const funnelAchievements = [
            { id: 'funnel-novice', threshold: 5 },
            { id: 'funnel-enthusiast', threshold: 15 },
            { id: 'funnel-pro', threshold: 30 },
            { id: 'funnel-master', threshold: 50 },
            { id: 'funnel-champion', threshold: 75 },
          ];

          funnelAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.totalFunnels, threshold);
              const shouldComplete = userStats.totalFunnels >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check shotgun achievements
          const shotgunAchievements = [
            { id: 'shotgun-novice', threshold: 10 },
            { id: 'shotgun-enthusiast', threshold: 25 },
            { id: 'shotgun-pro', threshold: 50 },
            { id: 'shotgun-master', threshold: 75 },
            { id: 'shotgun-champion', threshold: 100 },
          ];

          shotgunAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.totalShotguns, threshold);
              const shouldComplete = userStats.totalShotguns >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check pool game achievements
          const poolAchievements = [
            { id: 'pool-rookie', threshold: 5 },
            { id: 'pool-enthusiast', threshold: 15 },
            { id: 'pool-pro', threshold: 30 },
            { id: 'pool-master', threshold: 50 },
            { id: 'pool-champion', threshold: 75 },
          ];

          poolAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.totalPoolGamesWon, threshold);
              const shouldComplete = userStats.totalPoolGamesWon >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check dart game achievements
          const dartAchievements = [
            { id: 'dart-rookie', threshold: 5 },
            { id: 'dart-enthusiast', threshold: 15 },
            { id: 'dart-pro', threshold: 30 },
            { id: 'dart-master', threshold: 50 },
            { id: 'dart-champion', threshold: 75 },
          ];

          dartAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.totalDartGamesWon, threshold);
              const shouldComplete = userStats.totalDartGamesWon >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check bars visited achievements
          const barAchievements = [
            { id: 'bar-explorer', threshold: 5 },
            { id: 'bar-adventurer', threshold: 15 },
            { id: 'bar-enthusiast', threshold: 30 },
            { id: 'bar-connoisseur', threshold: 50 },
            { id: 'bar-legend', threshold: 100 },
          ];

          barAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.barsHit, threshold);
              const shouldComplete = userStats.barsHit >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          // Check nights out achievements
          const nightsAchievements = [
            { id: 'night-owl', threshold: 10 },
            { id: 'party-goer', threshold: 25 },
            { id: 'social-butterfly-nights', threshold: 50 },
            { id: 'nightlife-aficionado', threshold: 75 },
            { id: 'nightlife-legend', threshold: 100 },
          ];

          nightsAchievements.forEach(({ id, threshold }) => {
            const achievementIndex = updatedAchievements.findIndex(a => a.id === id);
            if (achievementIndex !== -1) {
              const achievement = updatedAchievements[achievementIndex];
              const newProgress = Math.min(userStats.nightsOut, threshold);
              const shouldComplete = userStats.nightsOut >= threshold;

              if (achievement.progress !== newProgress || (shouldComplete && !achievement.completed)) {
                updatedAchievements[achievementIndex] = {
                  ...achievement,
                  progress: newProgress,
                  completed: shouldComplete,
                  completedAt: shouldComplete && !achievement.completed ? new Date().toISOString() : achievement.completedAt
                };
                hasChanges = true;
              }
            }
          });

          if (hasChanges) {
            set({ achievements: updatedAchievements });
          }
        } catch (error) {
          console.warn('Error checking multi-level achievements:', error);
        }
      },

      getCompletedCount: () => {
        try {
          const { achievements } = get();
          return achievements.filter(a => a.completed).length;
        } catch (error) {
          console.warn('Error getting completed count:', error);
          return 0;
        }
      },

      resetAchievements: () => {
        try {
          set({
            achievements: defaultAchievements.map(a => ({ 
              ...a, 
              completed: false, 
              completedAt: undefined,
              progress: a.maxProgress ? 0 : undefined
            })),
            popupShown: false,
            lastPopupDate: null,
          });
        } catch (error) {
          console.warn('Error resetting achievements:', error);
        }
      },

      markPopupShown: () => {
        try {
          set({ popupShown: true });
        } catch (error) {
          console.warn('Error marking popup shown:', error);
        }
      },

      shouldShowPopup: () => {
        try {
          const { achievements, popupShown } = get();
          const hasIncompleteAchievements = achievements.some(a => !a.completed);
          return !popupShown && hasIncompleteAchievements;
        } catch (error) {
          console.warn('Error checking should show popup:', error);
          return false;
        }
      },

      shouldShow3AMPopup: () => {
        try {
          const { lastPopupDate } = get();
          const now = new Date();
          const currentHour = now.getHours();
          const today = now.toISOString();
          
          // Check if it's 3 AM and we haven't shown the popup today
          if (currentHour === 3) {
            if (!lastPopupDate || !isSameDay(lastPopupDate, today)) {
              return true;
            }
          }
          
          return false;
        } catch (error) {
          console.warn('Error checking 3AM popup:', error);
          return false;
        }
      },

      mark3AMPopupShown: () => {
        try {
          set({ lastPopupDate: new Date().toISOString() });
        } catch (error) {
          console.warn('Error marking 3AM popup shown:', error);
        }
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure achievements are properly initialized after rehydration
        if (state && (!state.achievements || state.achievements.length === 0)) {
          state.achievements = defaultAchievements;
        }
      },
    }
  )
);

// Store reference for cross-store access
if (typeof window !== 'undefined') {
  (window as any).__achievementStore = useAchievementStore;
}