import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Trophy, Award, Star, Target, Zap, Crown, Medal, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAchievementStoreSafe } from '@/stores/achievementStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
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
  const { isAuthenticated } = useAuthStore();
  const { 
    completedAchievements, 
    initializeAchievements, 
    isInitialized,
    checkAndUpdateMultiLevelAchievements 
  } = useAchievementStoreSafe();
  const { profile, profileReady, isLoading: profileLoading, syncStatsFromDailyStats } = useUserProfileStore();

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
  const [lastStatsUpdate, setLastStatsUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) {
      initializeAchievements();
    }
  }, [isInitialized, initializeAchievements]);

  // 🔧 FIXED: Replace the isDataReady check with proper null handling
  const isDataReady = useMemo(() => {
    return isAuthenticated && profile !== null && profile !== undefined && profileReady;
  }, [isAuthenticated, profile, profileReady]);

  // 🔧 FIXED: Replace the loadLifetimeStats function with null checks
  const loadLifetimeStats = async () => {
    if (!isDataReady || !profile) {
      console.log('🏆 Not ready to load stats - auth:', isAuthenticated, 'profile:', !!profile, 'ready:', profileReady);
      return;
    }

    setIsLoadingStats(true);
    console.log('🏆 Loading lifetime stats...');

    try {
      // 🔧 FIXED: Add explicit null checks for profile
      const fallbackStats = {
        totalBeers: profile?.total_beers || 0,
        totalShots: profile?.total_shots || 0,
        totalBeerTowers: profile?.total_beer_towers || 0,
        totalFunnels: profile?.total_funnels || 0,
        totalShotguns: profile?.total_shotguns || 0,
        totalPoolGames: profile?.pool_games_won || 0,
        totalDartGames: profile?.dart_games_won || 0,
        totalDrinksLogged: (profile?.total_beers || 0) + (profile?.total_shots || 0) + (profile?.total_beer_towers || 0) + (profile?.total_funnels || 0) + (profile?.total_shotguns || 0),
        avgDrunkScale: profile?.drunk_scale_ratings && profile.drunk_scale_ratings.length > 0 
          ? Math.round((profile.drunk_scale_ratings.reduce((sum, rating) => sum + rating, 0) / profile.drunk_scale_ratings.length) * 10) / 10
          : 0,
        barsHit: profile?.bars_hit || 0,
        nightsOut: profile?.nights_out || 0,
        totalXP: profile?.xp || 0,
      };

      // Set fallback data immediately
      setLifetimeStats(fallbackStats);

      // Try to enhance with daily stats, but don't block
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: dailyStats } = await supabase
              .from('daily_stats')
              .select('*')
              .eq('user_id', user.id);

            if (dailyStats && dailyStats.length > 0) {
              // Calculate enhanced stats from daily data
              const totals = dailyStats.reduce((acc, day) => ({
                totalBeers: acc.totalBeers + (Number(day.beers) || 0),
                totalShots: acc.totalShots + (Number(day.shots) || 0),
                totalBeerTowers: acc.totalBeerTowers + (Number(day.beer_towers) || 0),
                totalFunnels: acc.totalFunnels + (Number(day.funnels) || 0),
                totalShotguns: acc.totalShotguns + (Number(day.shotguns) || 0),
                totalPoolGames: acc.totalPoolGames + (Number(day.pool_games_won) || 0),
                totalDartGames: acc.totalDartGames + (Number(day.dart_games_won) || 0),
                drunkScaleSum: acc.drunkScaleSum + (Number(day.drunk_scale) || 0),
                drunkScaleCount: acc.drunkScaleCount + (day.drunk_scale ? 1 : 0),
                nightsOut: acc.nightsOut + 1,
              }), {
                totalBeers: 0, totalShots: 0, totalBeerTowers: 0, totalFunnels: 0, totalShotguns: 0,
                totalPoolGames: 0, totalDartGames: 0, drunkScaleSum: 0, drunkScaleCount: 0, nightsOut: 0,
              });

              const enhancedStats = {
                ...totals,
                totalDrinksLogged: totals.totalBeers + totals.totalShots + totals.totalBeerTowers + totals.totalFunnels + totals.totalShotguns,
                avgDrunkScale: totals.drunkScaleCount > 0 ? Math.round((totals.drunkScaleSum / totals.drunkScaleCount) * 10) / 10 : 0,
                barsHit: profile?.bars_hit || 0,
                totalXP: profile?.xp || 0,
              };

              setLifetimeStats(enhancedStats);
              console.log('✅ Enhanced stats loaded from daily_stats');
            }
          }
        } catch (enhanceError) {
          console.warn('⚠️ Could not enhance stats with daily data:', enhanceError);
          // Keep using fallback stats
        }
      }

      setLastStatsUpdate(new Date().toISOString());
      console.log('✅ Lifetime stats loaded successfully');
    } catch (error) {
      console.error('❌ Error loading lifetime stats:', error);
      // 🔧 FIXED: Add null check for profile in catch block
      if (profile) {
        setLifetimeStats({
          totalBeers: profile?.total_beers || 0,
          totalShots: profile?.total_shots || 0,
          totalBeerTowers: profile?.total_beer_towers || 0,
          totalFunnels: profile?.total_funnels || 0,
          totalShotguns: profile?.total_shotguns || 0,
          totalPoolGames: profile?.pool_games_won || 0,
          totalDartGames: profile?.dart_games_won || 0,
          totalDrinksLogged: 0,
          avgDrunkScale: 0,
          barsHit: profile?.bars_hit || 0,
          nightsOut: profile?.nights_out || 0,
          totalXP: profile?.xp || 0,
        });
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Load stats when profile becomes ready
  useEffect(() => {
    if (isDataReady && !isLoadingStats) {
      console.log('🏆 Data ready, loading stats...');
      loadLifetimeStats();
    }
  }, [isDataReady]);

  const onRefresh = async () => {
    if (!isAuthenticated || !isDataReady) return;
    
    setRefreshing(true);
    try {
      await syncStatsFromDailyStats();
      await loadLifetimeStats();
    } catch (error) {
      console.error('Error refreshing stats:', error);
      Alert.alert('Error', 'Failed to refresh stats. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!isAuthenticated || isLoadingStats) return;
    
    console.log('🏆 Trophies: Manual refresh triggered');
    await loadLifetimeStats();
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
      <View style={styles.statCardInner}>
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
      
      <View style={[styles.statAccent, { backgroundColor: themeColors.primary }]} />
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

  // 🔧 FIXED: Render logic with proper null checks
  const renderStatsContent = () => {
    if (!isAuthenticated) {
      return (
        <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            Sign In to View Stats
          </Text>
          <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
            Track your activities and see your lifetime stats here!
          </Text>
        </View>
      );
    }

    if (!profile) {
      return (
        <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            Loading Profile
          </Text>
          <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
            Getting your profile data...
          </Text>
        </View>
      );
    }

    if (isLoadingStats) {
      return (
        <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            Loading Stats
          </Text>
          <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
            Calculating your lifetime statistics...
          </Text>
        </View>
      );
    }

    // Show actual stats
    return (
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
            subtitle="out of 10"
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
    );
  };

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
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <BarBuddyLogo size="large" />
          </View>
        </View>

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
          {lastStatsUpdate && (
            <Text style={[styles.lastUpdate, { color: themeColors.subtext }]}>
              Last updated: {new Date(lastStatsUpdate).toLocaleTimeString()}
            </Text>
          )}
        </View>

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
          
          <Pressable 
            style={[styles.refreshButton, { backgroundColor: themeColors.primary + '20' }]}
            onPress={handleManualRefresh}
            disabled={isLoadingStats}
          >
            <RefreshCw 
              size={16} 
              color={themeColors.primary}
              style={[isLoadingStats && { transform: [{ rotate: '45deg' }] }]}
            />
          </Pressable>
        </View>

        {activeTab === 'stats' ? (
          <View style={styles.section}>
            {renderStatsContent()}
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
            ) : (
              <>
                {renderCategoryFilters()}

                {filteredTrophies.length === 0 ? (
                  <View style={[styles.emptyState, { backgroundColor: themeColors.card }]}>
                    <Text style={styles.emptyEmoji}>🏆</Text>
                    <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                      No Trophies Yet
                    </Text>
                    <Text style={[styles.emptyDescription, { color: themeColors.subtext }]}>
                      Start tracking your activities to earn your first trophy!
                    </Text>
                    <Pressable 
                      style={[styles.refreshButtonLarge, { backgroundColor: themeColors.primary }]}
                      onPress={handleManualRefresh}
                      disabled={isLoadingStats}
                    >
                      <RefreshCw size={16} color="white" />
                      <Text style={styles.refreshButtonText}>
                        {isLoadingStats ? 'Checking...' : 'Check for New Trophies'}
                      </Text>
                    </Pressable>
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
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    fontWeight: '400' as const,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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
    fontWeight: '600' as const,
  },
  refreshButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  bottomStatsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  statCardLarge: {
    padding: 24,
    minHeight: 120,
  },
  statCardInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statValueLarge: {
    fontSize: 36,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
    lineHeight: 18,
  },
  statTitleLarge: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  statSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  statAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.7,
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
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  trophyDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  refreshButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  footer: {
    height: 24,
  },
});