import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import { getThemeColors, spacing, typography, borderRadius, shadows } from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { useVenueInteractionStore } from '@/stores/venueInteractionStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { venues } from '@/mocks/venues';
import VenueCard from '@/components/VenueCard';
import TopPickCard from '@/components/TopPickCard';
import BarBuddyLogo from '@/components/BarBuddyLogo';
import DailyTracker from '@/components/DailyTracker';
import FilterBar from '@/components/FilterBar';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const themeColors = getThemeColors(theme);
  const { profile } = useUserProfileStore();
  const { getMostPopularVenues } = useVenueInteractionStore();
  const [dailyTrackerVisible, setDailyTrackerVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleDailyTrackerPress = () => {
    setDailyTrackerVisible(true);
  };

  const filteredVenues = selectedFilters.length > 0 
    ? venues.filter(venue => venue.types && venue.types.some(venueType => selectedFilters.includes(venueType)))
    : venues;

  const topPickIds = ['library-taphouse', 'late-night-library', 'jba-sports-bar'];
  const topPicks = venues.filter(venue => topPickIds.includes(venue.id)).slice(0, 3);

  const popularVenues = getMostPopularVenues();
  const maconBars = filteredVenues
    .sort((a, b) => {
      const aLikes = popularVenues.find(p => p.venueId === a.id)?.likes || 0;
      const bLikes = popularVenues.find(p => p.venueId === b.id)?.likes || 0;
      return bLikes - aLikes;
    });

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
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

        {/* Category Filter Bar */}
        <View style={styles.filterContainer}>
          <FilterBar 
            filters={selectedFilters}
            onFilterChange={setSelectedFilters}
            filterType="venue"
          />
        </View>

        {/* Daily Stat Tracker Tab */}
        <Pressable 
          style={[styles.dailyTrackerTab, { backgroundColor: themeColors.card }]}
          onPress={handleDailyTrackerPress}
        >
          <TrendingUp size={20} color={themeColors.primary} />
          <Text style={[styles.dailyTrackerText, { color: themeColors.text }]}>
            Daily Stat Tracker
          </Text>
        </Pressable>

        {/* Bar Buddy's Top Picks Section */}
        <View style={styles.topPicksSection}>
          <Text style={[styles.topPicksTitle, { color: themeColors.primary }]}>
            Bar Buddy's Top Picks
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topPicksScrollContent}
            style={styles.topPicksScroll}
          >
            {topPicks.map((venue) => (
              <TopPickCard key={venue.id} venue={venue} />
            ))}
          </ScrollView>
        </View>

        {/* Macon Bars Section */}
        <View style={styles.maconBarsSection}>
          <Text style={[styles.maconBarsTitle, { color: themeColors.text }]}>
            Macon Bars
          </Text>
        </View>
        
        <View style={styles.venueList}>
          {maconBars.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </View>

        <View style={styles.footer} />
      </ScrollView>

      <DailyTracker
        visible={dailyTrackerVisible}
        onClose={() => setDailyTrackerVisible(false)}
      />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    marginBottom: spacing.md,
  },
  dailyTrackerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  dailyTrackerText: {
    ...typography.bodyMedium,
    marginLeft: spacing.sm,
  },
  topPicksSection: {
    marginBottom: spacing.xl,
  },
  topPicksTitle: {
    ...typography.heading3,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  topPicksScroll: {
    marginBottom: 0,
  },
  topPicksScrollContent: {
    paddingHorizontal: spacing.lg,
  },
  maconBarsSection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  maconBarsTitle: {
    ...typography.heading2,
    textAlign: 'center',
  },
  venueList: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  footer: {
    height: spacing.xl,
  },
});