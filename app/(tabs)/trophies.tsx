import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, RefreshControl, Alert } from 'react-native';
import { Trophy, Award, Star, Target, Zap, Crown, Medal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAchievementStoreSafe } from '@/stores/achievementStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import BarBuddyLogo from '@/components/BarBuddyLogo';

const CATEGORY_CONFIG = {
  bars: { 
    label: 'Bar Hopping', 
    icon: Target, 
    color: '#FF6B35',
    gradient: ['#FF6B35', '#FF8F65'] as const
  },
  activities: { 
    label: 'Activities', 
    icon: Trophy, 
    color: '#007AFF',
    gradient: ['#007AFF', '#40A9FF'] as const
  },
  social: { 
    label: 'Social', 
    icon: Star, 
    color: '#34C759',
    gradient: ['#34C759', '#52D681'] as const
  },
  milestones: { 
    label: 'Milestones', 
    icon: Crown, 
    color: '#AF52DE',
    gradient: ['#AF52DE', '#C77DFF'] as const
  },
};

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { isAuthenticated, profile } = useAuthStore();
  const { 
    completedAchievements, 
    initializeAchievements, 
    isInitialized 
  } = useAchievementStoreSafe();

  const [activeTab, setActiveTab] = useState<'stats' | 'trophies'>('stats');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Initialize achievements when component mounts
  useEffect(() => {
    if (!isInitialized) {
      initializeAchievements();
    }
  }, [isInitialized, initializeAchievements]);

  // Load lifetime stats when component mounts or when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadLifetimeStats();
    }
  }, [isAuthenticated]);

  const loadLifetimeStats = async () => {
    if (!isSupabaseConfigured() || !isAuthenticated) {
      console.log('🏆 Trophies: Supabase not configured or user not authenticated');
      return;
    }

    setIsLoadingStats(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('🏆 Trophies: No authenticated user', userError);
        setIsLoadingStats(false);
        return;
      }

      console.log('🏆 Trophies: Loading lifetime stats from daily_stats table...');
      
      // Get all daily stats for the user
      const { data: dailyStats, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('🏆 Trophies: Error loading daily stats:', error);
        Alert.alert('Error', 'Failed to load stats. Please try again.');
        setIsLoadingStats(false);
        return;
      }

      // Calculate lifetime totals from daily stats
      const totals = (dailyStats || []).reduce((acc, day) => {
        // Ensure all values are numbers and handle null/undefined
        const beers = Number(day.beers) || 0;
        const shots = Number(day.shots) || 0;
        const beerTowers = Number(day.beer_towers) || 0;
        const funnels = Number(day.funnels) || 0;
        const shotguns = Number(day.shotguns) || 0;
        const poolGames = Number(day.pool_games_won) || 0;
        const dartGames = Number(day.dart_games_won) || 0;
        const drunkScale = Number(day.drunk_scale) || 0;

        return {
          totalBeers: acc.totalBeers + beers,
          totalShots: acc.totalShots + shots,
          totalBeerTowers: acc.totalBeerTowers + beerTowers,
          totalFunnels: acc.totalFunnels + funnels,
          totalShotguns: acc.totalShotguns + shotguns,
          totalPoolGames: acc.totalPoolGames + poolGames,
          totalDartGames: acc.totalDartGames + dartGames,
          totalDrinksLogged: acc.totalDrinksLogged + beers + shots + beerTowers + funnels + shotguns,
          drunkScaleSum: acc.drunkScaleSum + drunkScale,
          drunkScaleCount: acc.drunkScaleCount + (drunkScale > 0 ? 1 : 0),
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

      console.log('✅ Achievement progress updated successfully');
    } catch (error) {
      console.error('🏆 Trophies: Error loading lifetime stats:', error);
      Alert.alert('Error', 'Failed to load stats. Please try again.');
    } finally {
      setIsLoadingStats(false);
    }
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

  const StatCard = ({ title, value, subtitle, size = 'normal' }: { title: string; value: number | string; subtitle?: string; size?: 'normal' | 'large' }) => (
    <View style={[
      styles.statCard, 
      { backgroundColor: themeColors.card },
      size === 'large' && styles.statCardLarge
    ]}>
      <Text style={[
        styles.statValue, 
        { color: themeColors.primary },
        size === 'large' && styles.statValueLarge
      ]}>
        {value}
      </Text>
      <Text style={[
        styles.statTitle, 
        { color: themeColors.text },
        size === 'large' && styles.statTitleLarge
      ]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: themeColors.subtext }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const TrophyCard = ({ trophy }: { trophy: any }) => {
    const category = CATEGORY_CONFIG[trophy.category as keyof typeof CATEGORY_CONFIG];
    const IconComponent = category?.icon || Trophy;
    
    return (
      <View style={[styles.trophyCard, { backgroundColor: themeColors.card }]}>
        <LinearGradient
          colors={category?.gradient || ['#FF6B35', '#FF8F65'] as const}
          style={styles.trophyIconContainer}
        >
          <IconComponent size={24} color="white" />
        </LinearGradient>
        
        <View style={styles.trophyContent}>
          <Text style={[styles.trophyTitle, { color: themeColors.text }]}>{trophy.title}</Text>
          <Text style={[styles.trophyDescription, { color: themeColors.subtext }]}>
            {trophy.description}
          </Text>
          {trophy.level > 1 && (
            <View style={[styles.levelBadge, { backgroundColor: category?.color || themeColors.primary }]}>
              <Text style={styles.levelText}>Level {trophy.level}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.trophyMeta}>
          <View style={[styles.xpBadge, { backgroundColor: '#FFD60A20' }]}>
            <Zap size={12} color="#FFD60A" />
            <Text style={styles.xpText}>+{trophy.xpReward || 100}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
        <Pressable
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedCategory === 'all' ? '#FF6B35' : 'rgba(255,255,255,0.05)',
              borderColor: selectedCategory === 'all' ? '#FF6B35' : 'rgba(255,255,255,0.1)',
            }
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.filterText,
            { color: selectedCategory === 'all' ? 'white' : '#8E8E93' }
          ]}>
            All ({completedAchievements.length})
          </Text>
        </Pressable>

        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const IconComponent = config.icon;
          const isActive = selectedCategory === key;
          const categoryCount = completedAchievements.filter(t => t.category === key).length;
          
          return (
            <Pressable
              key={key}
              style={[
                styles.filterChip,
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
                {config.label} ({categoryCount})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
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

        {activeTab === 'stats' ? (
          /* Lifetime Stats Section */
          <View style={styles.section}>
            {!isAuthenticated ? (
              <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                  Sign In to View Stats
                </Text>
                <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
                  Track your activities and see your lifetime stats here!
                </Text>
              </View>
            ) : isLoadingStats ? (
              <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                <Text style={styles.emptyEmoji}>⏳</Text>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                  Loading Your Stats
                </Text>
                <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
                  Fetching your lifetime statistics from daily tracker...
                </Text>
              </View>
            ) : (
              <>
                {/* Activity Stats Grid */}
                <View style={styles.statsGrid}>
                  <StatCard title="Shots Taken" value={lifetimeStats.totalShots} />
                  <StatCard title="Beers Logged" value={lifetimeStats.totalBeers} />
                  <StatCard title="Beer Towers" value={lifetimeStats.totalBeerTowers} />
                  <StatCard title="Funnels" value={lifetimeStats.totalFunnels} />
                  <StatCard title="Shotguns" value={lifetimeStats.totalShotguns} />
                  <StatCard title="Pool Games Won" value={lifetimeStats.totalPoolGames} />
                  <StatCard title="Dart Games Won" value={lifetimeStats.totalDartGames} />
                </View>

                {/* Bottom Row - Larger Stats */}
                <View style={styles.bottomStatsGrid}>
                  <StatCard 
                    title="Bars Hit" 
                    value={lifetimeStats.barsHit}
                    size="large"
                  />
                  <StatCard 
                    title="Nights Out" 
                    value={lifetimeStats.nightsOut}
                    subtitle="Days with stats"
                    size="large"
                  />
                </View>

                <View style={styles.bottomStatsGrid}>
                  <StatCard 
                    title="Total Drinks Logged" 
                    value={lifetimeStats.totalDrinksLogged}
                    size="large"
                  />
                  <StatCard 
                    title="Average Drunk Scale" 
                    value={lifetimeStats.avgDrunkScale}
                    subtitle="out of 5"
                    size="large"
                  />
                </View>

                {/* XP Card */}
                <View style={styles.bottomStatsGrid}>
                  <StatCard 
                    title="Total XP Earned" 
                    value={lifetimeStats.totalXP}
                    subtitle="Experience Points"
                    size="large"
                  />
                </View>
              </>
            )}
          </View>
        ) : (
          /* Trophies Section */
          <View style={styles.section}>
            {!isAuthenticated ? (
              <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                <Text style={styles.emptyEmoji}>🏆</Text>
                <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                  Sign In to View Trophies
                </Text>
                <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
                  Earn trophies by tracking your activities and achievements!
                </Text>
              </View>
            ) : (
              <>
                {/* Category Filters */}
                {renderCategoryFilters()}

                {/* Trophies List */}
                {filteredTrophies.length === 0 ? (
                  <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                    <Text style={styles.emptyEmoji}>🏆</Text>
                    <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                      No Trophies Yet
                    </Text>
                    <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
                      Start tracking your activities to earn your first trophy!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.trophyList}>
                    {filteredTrophies.map((trophy) => (
                      <TrophyCard key={trophy.id} trophy={trophy} />
                    ))}
                  </View>
                )}
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
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  bottomStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statCardLarge: {
    padding: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statValueLarge: {
    fontSize: 36,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  statTitleLarge: {
    fontSize: 15,
    fontWeight: '700',
  },
  statSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  trophyList: {
    gap: 12,
  },
  trophyCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trophyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  trophyContent: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  trophyDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  trophyMeta: {
    alignItems: 'flex-end',
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
    fontWeight: '600',
    marginLeft: 4,
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
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    height: 24,
  },
});