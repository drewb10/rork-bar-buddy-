import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, RefreshControl } from 'react-native';
import { getThemeColors, spacing, typography, borderRadius, shadows } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAchievementStoreSafe } from '@/stores/achievementStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = getThemeColors(theme);
  const { isAuthenticated, profile } = useAuthStore();
  const { 
    completedAchievements, 
    initializeAchievements, 
    isInitialized 
  } = useAchievementStoreSafe();

  const [activeTab, setActiveTab] = useState<'stats' | 'trophies'>('stats');
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    if (!isInitialized) {
      initializeAchievements();
    }
  }, [isInitialized, initializeAchievements]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🏆 Trophies: No authenticated user');
        setIsLoadingStats(false);
        return;
      }

      console.log('🏆 Trophies: Loading lifetime stats from daily_stats table...');
      
      const { data: dailyStats, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('🏆 Trophies: Error loading daily stats:', error);
        setIsLoadingStats(false);
        return;
      }

      const totals = (dailyStats || []).reduce((acc, day) => ({
        totalBeers: acc.totalBeers + (day.beers || 0),
        totalShots: acc.totalShots + (day.shots || 0),
        totalBeerTowers: acc.totalBeerTowers + (day.beer_towers || 0),
        totalFunnels: acc.totalFunnels + (day.funnels || 0),
        totalShotguns: acc.totalShotguns + (day.shotguns || 0),
        totalPoolGames: acc.totalPoolGames + (day.pool_games_won || 0),
        totalDartGames: acc.totalDartGames + (day.dart_games_won || 0),
        totalDrinksLogged: acc.totalDrinksLogged + (day.beers || 0) + (day.shots || 0) + (day.beer_towers || 0) + (day.funnels || 0) + (day.shotguns || 0),
        drunkScaleSum: acc.drunkScaleSum + (day.drunk_scale || 0),
        drunkScaleCount: acc.drunkScaleCount + (day.drunk_scale ? 1 : 0),
        nightsOut: acc.nightsOut + 1,
      }), {
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
        barsHit: profile?.bars_hit || 0,
        nightsOut: totals.nightsOut,
        totalXP: profile?.xp || 0,
      });

      console.log('🏆 Trophies: Lifetime stats loaded successfully from daily_stats');
    } catch (error) {
      console.error('🏆 Trophies: Error loading lifetime stats:', error);
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
    } finally {
      setRefreshing(false);
    }
  };

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
    }).filter(category => category.count > 0);
  }, [completedAchievements]);

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

  const TrophyCard = ({ trophy }: { trophy: any }) => (
    <View style={[styles.trophyCard, { backgroundColor: themeColors.card }]}>
      <View style={[styles.trophyIcon, { backgroundColor: themeColors.primary + '20' }]}>
        <Text style={styles.trophyEmoji}>{trophy.icon}</Text>
      </View>
      <View style={styles.trophyContent}>
        <Text style={[styles.trophyTitle, { color: themeColors.text }]}>{trophy.title}</Text>
        <Text style={[styles.trophyDescription, { color: themeColors.subtext }]}>
          {trophy.description}
        </Text>
        {trophy.level > 1 && (
          <View style={[styles.levelBadge, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.levelText}>Level {trophy.level}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
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
            Your Trophies
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
                <View style={styles.statsGrid}>
                  <StatCard title="Shots Taken" value={lifetimeStats.totalShots} />
                  <StatCard title="Beers Logged" value={lifetimeStats.totalBeers} />
                  <StatCard title="Beer Towers" value={lifetimeStats.totalBeerTowers} />
                  <StatCard title="Funnels" value={lifetimeStats.totalFunnels} />
                  <StatCard title="Shotguns" value={lifetimeStats.totalShotguns} />
                  <StatCard title="Pool Games Won" value={lifetimeStats.totalPoolGames} />
                  <StatCard title="Dart Games Won" value={lifetimeStats.totalDartGames} />
                </View>

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
            ) : completedAchievements.length === 0 ? (
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
              <>
                {trophyCategories.map((category) => (
                  <View key={category.name} style={styles.categorySection}>
                    <Text style={[styles.categoryTitle, { color: themeColors.primary }]}>
                      {category.displayName} ({category.count})
                    </Text>
                    
                    <View style={styles.trophyList}>
                      {category.trophies.map((trophy) => (
                        <TrophyCard key={trophy.id} trophy={trophy} />
                      ))}
                    </View>
                  </View>
                ))}
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
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  pageTitle: {
    ...typography.heading1,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    ...typography.bodyMedium,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  bottomStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '48%',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statCardLarge: {
    padding: spacing.xl,
  },
  statValue: {
    ...typography.heading1,
    marginBottom: spacing.xs,
  },
  statValueLarge: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  statTitle: {
    ...typography.caption,
    textAlign: 'center',
  },
  statTitleLarge: {
    ...typography.captionMedium,
  },
  statSubtitle: {
    ...typography.small,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyState: {
    padding: spacing.xxl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading3,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryTitle: {
    ...typography.heading3,
    marginBottom: spacing.lg,
  },
  trophyList: {
    gap: spacing.md,
  },
  trophyCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  trophyIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  trophyEmoji: {
    fontSize: 28,
  },
  trophyContent: {
    flex: 1,
  },
  trophyTitle: {
    ...typography.bodyMedium,
    marginBottom: spacing.xs,
  },
  trophyDescription: {
    ...typography.caption,
    lineHeight: 20,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  levelText: {
    color: 'white',
    ...typography.captionMedium,
  },
  footer: {
    height: spacing.xl,
  },
});