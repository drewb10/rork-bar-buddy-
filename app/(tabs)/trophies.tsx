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
  Zap,
  Construction
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import { useRouter } from 'expo-router';
import { MVP_CONFIG } from '@/constants/mvp-config';

// Safe imports with error handling
let LifetimeStats: React.ComponentType<any> | null = null;
let useDailyStatsStore: any = null;

try {
  LifetimeStats = require('@/components/LifetimeStats').default;
} catch (error) {
  console.warn('LifetimeStats component not found');
}

try {
  useDailyStatsStore = require('@/stores/dailyStatsStore').useDailyStatsStore;
} catch (error) {
  console.warn('useDailyStatsStore not found');
}

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
  const router = useRouter();

  // MVP: Trophies system is disabled, show coming soon message
  if (!MVP_CONFIG.ENABLE_TROPHIES) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
              Trophies & Stats
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
              Achievement system coming soon
            </Text>
          </View>

          {/* Coming Soon Card */}
          <View style={[styles.comingSoonCard, { backgroundColor: themeColors.card }]}>
            <Trophy size={48} color={themeColors.primary} />
            <Text style={[styles.comingSoonTitle, { color: themeColors.text }]}>
              Trophies Coming Soon!
            </Text>
            <Text style={[styles.comingSoonDescription, { color: themeColors.subtext }]}>
              We're building an amazing trophy and statistics system. For now, focus on discovering bars and using the global like system!
            </Text>
            <View style={[styles.featureList, { borderColor: themeColors.border }]}>
              <Text style={[styles.featureTitle, { color: themeColors.text }]}>Planned Features:</Text>
              <Text style={[styles.featureItem, { color: themeColors.subtext }]}>• Lifetime statistics tracking</Text>
              <Text style={[styles.featureItem, { color: themeColors.subtext }]}>• Achievement trophies</Text>
              <Text style={[styles.featureItem, { color: themeColors.subtext }]}>• Progress tracking</Text>
              <Text style={[styles.featureItem, { color: themeColors.subtext }]}>• Leaderboards</Text>
            </View>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </View>
    );
  }

  // Original trophies code preserved but unreachable in MVP

  // Safe daily stats store usage
  const dailyStats = useDailyStatsStore?.((state: any) => state.dailyStats) || {};
  const loadDailyStats = useDailyStatsStore?.((state: any) => state.loadDailyStats) || (() => Promise.resolve());

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
    } else {
      setIsLoadingStats(false);
    }
  }, [isAuthenticated, profile]);

  const loadLifetimeStats = async () => {
    if (!isAuthenticated || !profile) {
      setIsLoadingStats(false);
      return;
    }

    try {
      setIsLoadingStats(true);
      
      // Load daily stats if available
      if (loadDailyStats) {
        await loadDailyStats();
      }
      
      // Calculate totals from daily stats
      const totals: {
        totalBeers: number;
        totalShots: number;
        totalBeerTowers: number;
        totalFunnels: number;
        totalShotguns: number;
        totalPoolGames: number;
        totalDartGames: number;
        totalDrinksLogged: number;
        drunkScaleSum: number;
        drunkScaleCount: number;
        nightsOut: number;
      } = Object.values(dailyStats || {}).reduce((acc: {
        totalBeers: number;
        totalShots: number;
        totalBeerTowers: number;
        totalFunnels: number;
        totalShotguns: number;
        totalPoolGames: number;
        totalDartGames: number;
        totalDrinksLogged: number;
        drunkScaleSum: number;
        drunkScaleCount: number;
        nightsOut: number;
      }, dayStats: any) => {
        if (!dayStats) return acc;
        
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

      const calculatedStats = {
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
      };

      setLifetimeStats(calculatedStats);

      // Generate achievements based on stats
      generateAchievements(totals, profile);

      console.log('✅ Achievement progress updated successfully');
    } catch (error) {
      console.error('🏆 Trophies: Error loading lifetime stats:', error);
      // Don't show alert in demo mode or if stores aren't available
      if (isAuthenticated && useDailyStatsStore) {
        Alert.alert('Error', 'Failed to load stats. Please try again.');
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  const generateAchievements = (stats: any, userProfile: any) => {
    if (!userProfile || !stats) return;

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
        progress: Math.min(stats.totalBeers || 0, 1),
        maxProgress: 1,
        isCompleted: (stats.totalBeers || 0) >= 1,
        dateCompleted: (stats.totalBeers || 0) >= 1 ? new Date().toISOString() : undefined,
      },
      {
        id: 'beer_lover',
        title: 'Beer Lover',
        description: 'Log 25 beers',
        category: 'activities',
        level: 'silver',
        xpReward: 200,
        progress: Math.min(stats.totalBeers || 0, 25),
        maxProgress: 25,
        isCompleted: (stats.totalBeers || 0) >= 25,
        dateCompleted: (stats.totalBeers || 0) >= 25 ? new Date().toISOString() : undefined,
      },
      {
        id: 'shot_master',
        title: 'Shot Master',
        description: 'Log 50 shots',
        category: 'activities',
        level: 'gold',
        xpReward: 300,
        progress: Math.min(stats.totalShots || 0, 50),
        maxProgress: 50,
        isCompleted: (stats.totalShots || 0) >= 50,
        dateCompleted: (stats.totalShots || 0) >= 50 ? new Date().toISOString() : undefined,
      },
      // Game achievements
      {
        id: 'pool_shark',
        title: 'Pool Shark',
        description: 'Win 5 pool games',
        category: 'activities',
        level: 'silver',
        xpReward: 250,
        progress: Math.min(stats.totalPoolGames || 0, 5),
        maxProgress: 5,
        isCompleted: (stats.totalPoolGames || 0) >= 5,
        dateCompleted: (stats.totalPoolGames || 0) >= 5 ? new Date().toISOString() : undefined,
      },
      {
        id: 'dart_champion',
        title: 'Dart Champion',
        description: 'Win 5 dart games',
        category: 'activities',
        level: 'silver',
        xpReward: 250,
        progress: Math.min(stats.totalDartGames || 0, 5),
        maxProgress: 5,
        isCompleted: (stats.totalDartGames || 0) >= 5,
        dateCompleted: (stats.totalDartGames || 0) >= 5 ? new Date().toISOString() : undefined,
      },
      // Social achievements
      {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Complete 10 nights out',
        category: 'social',
        level: 'gold',
        xpReward: 400,
        progress: Math.min(stats.nightsOut || 0, 10),
        maxProgress: 10,
        isCompleted: (stats.nightsOut || 0) >= 10,
        dateCompleted: (stats.nightsOut || 0) >= 10 ? new Date().toISOString() : undefined,
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
      if (useDailyStatsStore) {
        Alert.alert('Error', 'Failed to refresh stats. Please try again.');
      }
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
        ].map(({ key, label, icon: IconComponent, color }) => {
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
                  backgroundColor: isActive ? color : 'rgba(255,255,255,0.05)',
                  borderColor: isActive ? color : 'rgba(255,255,255,0.1)',
                }
              ]}
              onPress={() => setSelectedCategory(key as any)}
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
          </Pressable>
          <Pressable 
            style={[
              styles.tab, 
              activeTab === 'trophies' && { backgroundColor: themeColors.primary + '20', borderColor: themeColors.primary }
            ]}
            onPress={() => setActiveTab('trophies')}
          >
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'trophies' ? themeColors.primary : themeColors.subtext }
            ]}>
              Trophies ({completedAchievements.length})
            </Text>
          </Pressable>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'stats' ? (
          <View style={styles.statsContent}>
            {isLoadingStats ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text style={[styles.loadingText, { color: themeColors.text }]}>
                  Loading stats...
                </Text>
              </View>
            ) : LifetimeStats ? (
              <LifetimeStats 
                stats={{
                  barsHit: lifetimeStats.barsHit,
                  nightsOut: lifetimeStats.nightsOut,
                  totalBeers: lifetimeStats.totalBeers,
                  totalShots: lifetimeStats.totalShots,
                  totalPoolGames: lifetimeStats.totalPoolGames,
                  totalDartGames: lifetimeStats.totalDartGames,
                  avgDrunkScale: lifetimeStats.avgDrunkScale,
                }}
              />
            ) : (
              <View style={[styles.placeholderContainer, { backgroundColor: themeColors.card }]}>
                <Text style={[styles.placeholderText, { color: themeColors.text }]}>
                  Lifetime Stats
                </Text>
                <Text style={[styles.placeholderSubtext, { color: themeColors.subtext }]}>
                  Component not available in demo mode
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.trophiesContent}>
            {!isAuthenticated ? (
              <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                  Sign In to Earn Trophies
                </Text>
                <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
                  Track your bar adventures and unlock achievements by signing in to your account.
                </Text>
                <Pressable 
                  style={[styles.signInButton, { backgroundColor: themeColors.primary }]}
                  onPress={() => router.push('/auth/sign-in')}
                >
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </Pressable>
              </View>
            ) : completedAchievements.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                <Text style={styles.emptyEmoji}>🎯</Text>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                  No Trophies Yet
                </Text>
                <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
                  Start visiting bars, logging drinks, and playing games to earn your first trophies!
                </Text>
              </View>
            ) : (
              <>
                {/* Filter Tabs */}
                <FilterTabs />

                {/* Trophy Grid */}
                <View style={styles.trophyGrid}>
                  {filteredTrophies.map((trophy) => (
                    <View key={trophy.id} style={[styles.trophyCard, { backgroundColor: themeColors.card }]}>
                      <View style={styles.trophyHeader}>
                        <Trophy size={24} color={getLevelColor(trophy.level)} />
                        <View style={[styles.xpBadge, { backgroundColor: '#FFD60A' + '20' }]}>
                          <Zap size={12} color="#FFD60A" />
                          <Text style={styles.xpText}>+{trophy.xpReward}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.trophyContent}>
                        <Text style={[styles.trophyTitle, { color: themeColors.text }]}>
                          {trophy.title}
                        </Text>
                        <Text style={[styles.trophyDescription, { color: themeColors.subtext }]}>
                          {trophy.description}
                        </Text>
                        <View style={[styles.levelBadge, { backgroundColor: getLevelColor(trophy.level) }]}>
                          <Text style={styles.levelText}>{trophy.level.toUpperCase()}</Text>
                        </View>
                      </View>

                      {trophy.dateCompleted && (
                        <Text style={[styles.completedDate, { color: themeColors.subtext }]}>
                          Completed {new Date(trophy.dateCompleted).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statsContent: {
    flex: 1,
  },
  trophiesContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderContainer: {
    margin: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterScrollView: {
    paddingHorizontal: 0,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  trophyGrid: {
    gap: 16,
  },
  trophyCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trophyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trophyContent: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  trophyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  levelText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  completedDate: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  signInButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    height: 24,
  },
  // MVP Coming Soon Styles
  comingSoonCard: {
    margin: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  comingSoonDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  featureList: {
    width: '100%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: '500',
  },
});
