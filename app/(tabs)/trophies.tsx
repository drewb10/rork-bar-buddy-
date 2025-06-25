import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useAchievementStoreSafe } from '@/stores/achievementStore';
import BarBuddyLogo from '@/components/BarBuddyLogo';

export default function TrophiesScreen() {
  const { theme } = useThemeStore();
  const themeColors = colors[theme];
  const { profile } = useUserProfileStore();
  const { 
    completedAchievements, 
    initializeAchievements, 
    isInitialized 
  } = useAchievementStoreSafe();

  // Initialize achievements when component mounts
  useEffect(() => {
    if (!isInitialized) {
      initializeAchievements();
    }
  }, [isInitialized, initializeAchievements]);

  // Memoize lifetime stats to prevent unnecessary recalculations
  const lifetimeStats = useMemo(() => {
    if (!profile) {
      return {
        barsHit: 0,
        nightsOut: 0,
        drinksLogged: 0,
        drunkScaleAvg: 0,
        totalShots: 0,
      };
    }

    const totalDrinks = (profile.total_beers || 0) + 
                       (profile.total_shots || 0) + 
                       (profile.total_scoop_and_scores || 0) + 
                       (profile.total_beer_towers || 0) + 
                       (profile.total_funnels || 0) + 
                       (profile.total_shotguns || 0);

    const drunkScaleAvg = profile.drunk_scale_ratings && profile.drunk_scale_ratings.length > 0
      ? Math.round((profile.drunk_scale_ratings.reduce((sum, rating) => sum + rating, 0) / profile.drunk_scale_ratings.length) * 10) / 10
      : 0;

    return {
      barsHit: profile.bars_hit || 0,
      nightsOut: profile.nights_out || 0,
      drinksLogged: totalDrinks,
      drunkScaleAvg,
      totalShots: profile.total_shots || 0,
    };
  }, [profile]);

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

  const StatCard = ({ title, value, subtitle }: { title: string; value: number | string; subtitle?: string }) => (
    <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.statValue, { color: themeColors.primary }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: themeColors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: themeColors.subtext }]}>{subtitle}</Text>
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
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
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
            Your Trophies
          </Text>
        </View>

        {/* Lifetime Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Lifetime Stats
          </Text>
          
          <View style={styles.statsGrid}>
            <StatCard 
              title="Bars Hit" 
              value={lifetimeStats.barsHit}
            />
            <StatCard 
              title="Nights Out" 
              value={lifetimeStats.nightsOut}
            />
            <StatCard 
              title="Drinks Logged" 
              value={lifetimeStats.drinksLogged}
            />
            <StatCard 
              title="Drunk Scale Avg" 
              value={lifetimeStats.drunkScaleAvg}
              subtitle="out of 5"
            />
          </View>
        </View>

        {/* Trophies Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Trophies ({completedAchievements.length})
          </Text>
          
          {completedAchievements.length === 0 ? (
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
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 20,
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
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  statSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
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
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
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
  trophyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trophyEmoji: {
    fontSize: 28,
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
  footer: {
    height: 24,
  },
});