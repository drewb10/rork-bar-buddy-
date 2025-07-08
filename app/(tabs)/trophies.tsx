import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { 
  Trophy, 
  Award, 
  Star, 
  Users, 
  MapPin, 
  Calendar,
  Target,
  Zap
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useDailyStatsStore } from '@/stores/dailyStatsStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import LifetimeStats from '@/components/LifetimeStats';
import { useRouter } from 'expo-router';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'bars' | 'activities' | 'social' | 'milestones';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  dateCompleted?: string;
}

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile, isAuthenticated } = useAuthStore();
  const { dailyStats, loadDailyStats } = useDailyStatsStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'stats' | 'trophies'>('stats');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bars' | 'activities' | 'social' | 'milestones'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [completedAchievements, setCompletedAchievements] = useState<Achievement[]>([]);
  const [lifetimeStats, setLifetimeStats] = useState({
    totalBeers: 0,
    totalShots: 0,
    totalBeerTowers: 0,
    totalFunnels: 0,
    totalShotguns: 0,
    totalPoolGames: 0,
    totalDartGames: 0,
    totalDrinksLogged: 0,
    avgDrunkScale: 0,
    barsHit: 0,
    nightsOut: 0,
    totalXP: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadLifetimeStats();
    }
  }, [isAuthenticated, profile]);

  const loadLifetimeStats = async () => {
    if (!isAuthenticated || !profile) return;

    try {
      setIsLoadingStats(true);
      
      // Load daily stats
      await loadDailyStats();
      
      // Calculate totals from daily stats
      const totals = Object.values(dailyStats).reduce((acc, dayStats) => {
        return {
          totalBeers: acc.totalBeers + (dayStats.beers || 0),
          totalShots: acc.totalShots + (dayStats.shots || 0),
          totalBeerTowers: acc.totalBeerTowers + (dayStats.beer_towers || 0),
          totalFunnels: acc.totalFunnels + (dayStats.funnels || 0),
          totalShotguns: acc.totalShotguns + (dayStats.shotguns || 0),
          totalPoolGames: acc.totalPoolGames + (dayStats.pool_games_won || 0),
          totalDartGames: acc.totalDartGames + (dayStats.dart_games_won || 0),
          totalDrinksLogged: acc.totalDrinksLogged + 
            (dayStats.beers || 0) + 
            (dayStats.shots || 0) + 
            (dayStats.beer_towers || 0) + 
            (dayStats.funnels || 0) + 
            (dayStats.shotguns || 0),
          drunkScaleSum: acc.drunkScaleSum + (dayStats.drunk_scale || 0),
          drunkScaleCount: acc.drunkScaleCount + (dayStats.drunk_scale ? 1 : 0),
          nightsOut: acc.nightsOut + 1, // Each day with stats counts as a night out
        };
      }, {
        totalBeers: 0,
        totalShots: 0,
        totalBeerTowers: 0,
        totalFunnels: 0,
        totalShotguns: 0,
        totalPoolGames: 0,
        totalDartGames: 0,
        totalDrinksLogged: 0,
        drunkScaleSum: 0,
        drunkScaleCount: 0,
        nightsOut: 0,
      });

      // Calculate average drunk scale
      const avgDrunkScale = totals.drunkScaleCount > 0 
        ? Math.round((totals.drunkScaleSum / totals.drunkScaleCount) * 10) / 10 
        : 0;

      setLifetimeStats({
        totalBeers: totals.totalBeers,
        totalShots: totals.totalShots,
        totalBeerTowers: totals.totalBeerTowers,
        totalFunnels: totals.totalFunnels,
        totalShotguns: totals.totalShotguns,
        totalPoolGames: totals.totalPoolGames,
        totalDartGames: totals.totalDartGames,
        totalDrinksLogged: totals.totalDrinksLogged,
        avgDrunkScale: avgDrunkScale,
        barsHit: profile?.bars_hit || 0, // Still from profile
        nightsOut: totals.nightsOut,
        totalXP: profile?.xp || 0, // XP still comes from profile
      });

      // Generate achievements based on stats
      generateAchievements(totals, profile);

      console.log('✅ Achievement progress updated successfully');
    } catch (error) {
      console.error('🏆 Trophies: Error loading lifetime stats:', error);
      Alert.alert('Error', 'Failed to load stats. Please try again.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const generateAchievements = (stats: any, userProfile: any) => {
    const achievements: Achievement[] = [
      // Bar achievements
      {
        id: 'first_bar',
        title: 'First Bar',
        description: 'Visit your first bar',
        category: 'bars',
        level: 'bronze',
        xpReward: 100,
        progress: Math.min(userProfile?.bars_hit || 0, 1),
        maxProgress: 1,
        isCompleted: (userProfile?.bars_hit || 0) >= 1,
        dateCompleted: (userProfile?.bars_hit || 0) >= 1 ? new Date().toISOString() : undefined,
      },
      {
        id: 'bar_explorer',
        title: 'Bar Explorer',
        description: 'Visit 5 different bars',
        category: 'bars',
        level: 'silver',
        xpReward: 250,
        progress: Math.min(userProfile?.bars_hit || 0, 5),
        maxProgress: 5,
        isCompleted: (userProfile?.bars_hit || 0) >= 5,
        dateCompleted: (userProfile?.bars_hit || 0) >= 5 ? new Date().toISOString() : undefined,
      },
      {
        id: 'bar_master',
        title: 'Bar Master',
        description: 'Visit 10 different bars',
        category: 'bars',
        level: 'gold',
        xpReward: 500,
        progress: Math.min(userProfile?.bars_hit || 0, 10),
        maxProgress: 10,
        isCompleted: (userProfile?.bars_hit || 0) >= 10,
        dateCompleted: (userProfile?.bars_hit || 0) >= 10 ? new Date().toISOString() : undefined,
      },
      // Drinking achievements
      {
        id: 'first_beer',
        title: 'First Beer',
        description: 'Log your first beer',
        category: 'activities',
        level: 'bronze',
        xpReward: 50,
        progress: Math.min(stats.totalBeers, 1),
        maxProgress: 1,
        isCompleted: stats.totalBeers >= 1,
        dateCompleted: stats.totalBeers >= 1 ? new Date().toISOString() : undefined,
      },
      {
        id: 'beer_lover',
        title: 'Beer Lover',
        description: 'Log 25 beers',
        category: 'activities',
        level: 'silver',
        xpReward: 200,
        progress: Math.min(stats.totalBeers, 25),
        maxProgress: 25,
        isCompleted: stats.totalBeers >= 25,
        dateCompleted: stats.totalBeers >= 25 ? new Date().toISOString() : undefined,
      },
      {
        id: 'shot_master',
        title: 'Shot Master',
        description: 'Log 50 shots',
        category: 'activities',
        level: 'gold',
        xpReward: 300,
        progress: Math.min(stats.totalShots, 50),
        maxProgress: 50,
        isCompleted: stats.totalShots >= 50,
        dateCompleted: stats.totalShots >= 50 ? new Date().toISOString() : undefined,
      },
      // Game achievements
      {
        id: 'pool_shark',
        title: 'Pool Shark',
        description: 'Win 5 pool games',
        category: 'activities',
        level: 'silver',
        xpReward: 250,
        progress: Math.min(stats.totalPoolGames, 5),
        maxProgress: 5,
        isCompleted: stats.totalPoolGames >= 5,
        dateCompleted: stats.totalPoolGames >= 5 ? new Date().toISOString() : undefined,
      },
      {
        id: 'dart_champion',
        title: 'Dart Champion',
        description: 'Win 5 dart games',
        category: 'activities',
        level: 'silver',
        xpReward: 250,
        progress: Math.min(stats.totalDartGames, 5),
        maxProgress: 5,
        isCompleted: stats.totalDartGames >= 5,
        dateCompleted: stats.totalDartGames >= 5 ? new Date().toISOString() : undefined,
      },
      // Social achievements
      {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Complete 10 nights out',
        category: 'social',
        level: 'gold',
        xpReward: 400,
        progress: Math.min(stats.nightsOut, 10),
        maxProgress: 10,
        isCompleted: stats.nightsOut >= 10,
        dateCompleted: stats.nightsOut >= 10 ? new Date().toISOString() : undefined,
      },
      // Milestone achievements
      {
        id: 'xp_collector',
        title: 'XP Collector',
        description: 'Earn 1000 XP',
        category: 'milestones',
        level: 'silver',
        xpReward: 500,
        progress: Math.min(userProfile?.xp || 0, 1000),
        maxProgress: 1000,
        isCompleted: (userProfile?.xp || 0) >= 1000,
        dateCompleted: (userProfile?.xp || 0) >= 1000 ? new Date().toISOString() : undefined,
      },
      {
        id: 'xp_master',
        title: 'XP Master',
        description: 'Earn 5000 XP',
        category: 'milestones',
        level: 'gold',
        xpReward: 1000,
        progress: Math.min(userProfile?.xp || 0, 5000),
        maxProgress: 5000,
        isCompleted: (userProfile?.xp || 0) >= 5000,
        dateCompleted: (userProfile?.xp || 0) >= 5000 ? new Date().toISOString() : undefined,
      },
    ];

    // Only show completed achievements
    const completed = achievements.filter(achievement => achievement.isCompleted);
    setCompletedAchievements(completed);
  };

  const onRefresh = async () => {
    if (!isAuthenticated) return;
    
    setRefreshing(true);
    try {
      await loadLifetimeStats();
    } catch (error) {
      console.error('Error refreshing stats:', error);
      Alert.alert('Error', 'Failed to refresh stats. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Memoize trophy categories
  const trophyCategories = useMemo(() => {
    const categories = ['bars', 'activities', 'social', 'milestones'] as const;
    
    return categories.map(category => {
      const categoryTrophies = completedAchievements.filter(trophy => trophy.category === category);
      
      return {
        name: category,
        displayName: category.charAt(0).toUpperCase() + category.slice(1),
        trophies: categoryTrophies,
        count: categoryTrophies.length
      };
    }).filter(category => category.count > 0); // Only show categories with trophies
  }, [completedAchievements]);

  const filteredTrophies = useMemo(() => {
    if (selectedCategory === 'all') return completedAchievements;
    return completedAchievements.filter(trophy => trophy.category === selectedCategory);
  }, [completedAchievements, selectedCategory]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return themeColors.primary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bars': return MapPin;
      case 'activities': return Target;
      case 'social': return Users;
      case 'milestones': return Star;
      default: return Trophy;
    }
  };

  const FilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        {[
          { key: 'all', label: 'All', icon: Trophy, color: themeColors.primary },
          ...trophyCategories.map(cat => ({
            key: cat.name,
            label: cat.displayName,
            icon: getCategoryIcon(cat.name),
            color: themeColors.primary
          }))
        ].map(({ key, label, icon: IconComponent, color: config.color }) => {
          const isActive = selectedCategory === key;
          const categoryCount = key === 'all' 
            ? completedAchievements.length 
            : trophyCategories.find(cat => cat.name === key)?.count || 0;

          return (
            <Pressable
              key={key}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive ? config.color : 'rgba(255,255,255,0.05)',
                  borderColor: isActive ? config.color : 'rgba(255,255,255,0.1)',
                }
              ]}
              onPress={() => setSelectedCategory(key)}
            >
              <IconComponent 
                size={14} 
                color={isActive ? 'white' : '#8E8E93'} 
              />
              <Text style={[
                styles.filterText,
                { color: isActive ? 'white' : '#8E8E93' }
              ]}>
                {label} ({categoryCount})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <BarBuddyLogo size="large" />
          </View>
        </View>

        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: themeColors.text }]}>
            Your Achievements
          </Text>
          {profile && (
            <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
              @{profile.username} • {lifetimeStats.totalXP} XP
            </Text>
          )}
          {!isAuthenticated && (
            <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
              Sign in to track your stats and earn trophies
            </Text>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Pressable 
            style={[
              styles.tab, 
              activeTab === 'stats' && { backgroundColor: themeColors.primary + '20', borderColor: themeColors.primary }
            ]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'stats' ? themeColors.primary : themeColors.subtext }
            ]}>
              Lifetime Stats
            </Text>
